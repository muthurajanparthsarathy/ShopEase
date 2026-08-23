using System.Text;
using System.Text.Json;
using ShopEase.Application.Abstractions;
using ShopEase.Application.Common;
using ShopEase.Application.Features.Auth.Dtos;
using ShopEase.Application.Features.Cart.Services;
using ShopEase.Application.Features.Notifications.Services;
using ShopEase.Application.Features.Orders.Dtos;
using ShopEase.Domain.Features.Audit.Entities;
using ShopEase.Domain.Features.Orders.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Orders.Services;

public class OrderService : IOrderService
{
    private static readonly Dictionary<string, string[]> ValidTransitions = new()
    {
        ["Pending"] = new[] { "Processing", "Cancelled" },
        ["Processing"] = new[] { "Shipped", "Cancelled" },
        ["Shipped"] = new[] { "Delivered" },
        ["Delivered"] = Array.Empty<string>(),
        ["Cancelled"] = Array.Empty<string>(),
        ["Returned"] = Array.Empty<string>(),
    };

    private readonly IOrderRepository _orders;
    private readonly IProductRepository _products;
    private readonly IAddressRepository _addresses;
    private readonly ICartService _cart;
    private readonly INotificationService _notifications;
    private readonly IAuditLogRepository _auditLogs;
    private readonly ICurrentUserService _currentUser;

    public OrderService(
        IOrderRepository orders, IProductRepository products, IAddressRepository addresses,
        ICartService cart, INotificationService notifications, IAuditLogRepository auditLogs, ICurrentUserService currentUser)
    {
        _orders = orders;
        _products = products;
        _addresses = addresses;
        _cart = cart;
        _notifications = notifications;
        _auditLogs = auditLogs;
        _currentUser = currentUser;
    }

    public async Task<List<OrderDto>> GetAllAsync() => (await _orders.GetAllAsync()).Select(ToDto).ToList();

    public async Task<OrderDto?> GetByIdAsync(int id)
    {
        var order = await _orders.GetByIdAsync(id);
        return order == null ? null : ToDto(order);
    }

    public async Task<List<OrderDto>> GetByUserIdAsync(int userId) =>
        (await _orders.GetByUserIdAsync(userId)).Select(ToDto).ToList();

    public async Task<Result<OrderDto>> PlaceOrderAsync(int userId, int addressId, int paymentMethodId)
    {
        var summary = await _cart.GetSummaryAsync(userId);
        if (summary.Items.Count == 0) return Result<OrderDto>.Fail("Your cart is empty.");

        var address = await _addresses.GetByIdAsync(addressId);
        if (address == null || address.UserId != userId) return Result<OrderDto>.Fail("Please select a delivery address.");

        var products = await _products.GetAllAsync();
        var byId = products.ToDictionary(p => p.Id);

        foreach (var item in summary.Items)
        {
            if (!byId.TryGetValue(item.ProductId, out var product) || product.Stock < item.Quantity)
                return Result<OrderDto>.Fail($"Insufficient stock for {item.Name}.");
        }

        foreach (var item in summary.Items)
        {
            var product = byId[item.ProductId];
            product.Stock -= item.Quantity;
            await _products.UpdateAsync(product);
        }

        var order = new Order
        {
            OrderNumber = GenerateOrderNumber(),
            UserId = userId,
            Items = summary.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId, Name = i.Name, Brand = i.Brand, Price = i.Price,
                Quantity = i.Quantity, Subtotal = i.Price * i.Quantity,
            }).ToList(),
            Subtotal = summary.Subtotal,
            Tax = summary.Tax,
            Shipping = summary.Shipping,
            Discount = summary.Discount,
            Total = summary.Total,
            AddressJson = JsonSerializer.Serialize(new AddressDto
            {
                Id = address.Id, Label = address.Label, Line = address.Line,
                City = address.City, State = address.State, PostalCode = address.PostalCode, IsDefault = address.IsDefault,
            }),
            PaymentMethodId = paymentMethodId,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _orders.AddAsync(order);
        await _cart.ClearCartAsync(userId);
        await _notifications.NotifyOrderPlacedAsync(userId, order.OrderNumber);

        return Result<OrderDto>.Ok(ToDto(order), "Order placed successfully!");
    }

    public async Task<Result> UpdateStatusAsync(int orderId, string newStatus)
    {
        var order = await _orders.GetByIdAsync(orderId);
        if (order == null) return Result.Fail("Order not found.");

        var allowed = ValidTransitions.GetValueOrDefault(order.Status, Array.Empty<string>());
        if (!allowed.Contains(newStatus))
            return Result.Fail($"Cannot change status from {order.Status} to {newStatus}.");

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        await _orders.UpdateAsync(order);

        if (newStatus == "Cancelled") await RestoreStockAsync(order.Items);

        await _auditLogs.AddAsync(new AuditLog
        {
            UserId = _currentUser.UserId,
            Action = "OrderStatusChanged",
            Entity = "Order",
            EntityId = order.Id.ToString(),
            IpAddress = _currentUser.IpAddress,
            Details = $"{order.OrderNumber}: {newStatus}",
        });

        await _notifications.NotifyOrderStatusChangedAsync(order.UserId, order.OrderNumber, newStatus);
        return Result.Ok($"Order status updated to {newStatus}.");
    }

    public async Task<Result> CancelAsync(int orderId, int userId)
    {
        var order = await _orders.GetByIdAsync(orderId);
        if (order == null) return Result.Fail("Order not found.");
        if (order.UserId != userId) return Result.Fail("Unauthorized.");
        if (order.Status != "Pending") return Result.Fail("Only pending orders can be cancelled.");

        return await UpdateStatusAsync(orderId, "Cancelled");
    }

    public async Task<Result> ReturnAsync(int orderId, int userId)
    {
        var order = await _orders.GetByIdAsync(orderId);
        if (order == null) return Result.Fail("Order not found.");
        if (order.UserId != userId) return Result.Fail("Unauthorized.");
        if (order.Status != "Delivered") return Result.Fail("Only delivered orders can be returned.");

        order.Status = "Returned";
        order.UpdatedAt = DateTime.UtcNow;
        await _orders.UpdateAsync(order);
        await RestoreStockAsync(order.Items);
        await _notifications.NotifyOrderStatusChangedAsync(order.UserId, order.OrderNumber, "Returned");

        return Result.Ok("Return request submitted. Your refund will be processed after inspection.");
    }

    public async Task<Result> SetCustomFieldsAsync(int orderId, Dictionary<string, object> custom)
    {
        var order = await _orders.GetByIdAsync(orderId);
        if (order == null) return Result.Fail("Order not found.");

        order.CustomFieldsJson = JsonSerializer.Serialize(custom);
        order.UpdatedAt = DateTime.UtcNow;
        await _orders.UpdateAsync(order);

        return Result.Ok("Additional details saved.");
    }

    public List<OrderDto> ApplyFilters(List<OrderDto> orders, OrderFiltersQuery filters)
    {
        IEnumerable<OrderDto> result = orders;
        if (!string.IsNullOrEmpty(filters.Status)) result = result.Where(o => o.Status == filters.Status);
        if (filters.CustomerId != null) result = result.Where(o => o.UserId == filters.CustomerId);
        if (filters.DateFrom != null) result = result.Where(o => o.CreatedAt >= filters.DateFrom);
        if (filters.DateTo != null) { var to = filters.DateTo.Value.Date.AddDays(1).AddTicks(-1); result = result.Where(o => o.CreatedAt <= to); }
        if (filters.MinAmount != null) result = result.Where(o => o.Total >= filters.MinAmount);
        if (filters.MaxAmount != null) result = result.Where(o => o.Total <= filters.MaxAmount);
        return result.OrderByDescending(o => o.CreatedAt).ToList();
    }

    public Task<List<string>> GetOrderStatusesAsync() => _orders.GetOrderStatusNamesAsync();

    private async Task RestoreStockAsync(List<OrderItem> items)
    {
        var products = await _products.GetAllAsync();
        var byId = products.ToDictionary(p => p.Id);
        foreach (var item in items)
        {
            if (!byId.TryGetValue(item.ProductId, out var product)) continue;
            product.Stock += item.Quantity;
            await _products.UpdateAsync(product);
        }
    }

    private static string GenerateOrderNumber()
    {
        var ts = ToBase36(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        var rand = ToBase36(Random.Shared.Next(0, 36 * 36 * 36 * 36)).PadLeft(4, '0');
        return $"ORD-{ts}-{rand}";
    }

    private static string ToBase36(long value)
    {
        const string chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (value == 0) return "0";
        var sb = new StringBuilder();
        while (value > 0)
        {
            sb.Insert(0, chars[(int)(value % 36)]);
            value /= 36;
        }
        return sb.ToString();
    }

    private static OrderDto ToDto(Order o) => new()
    {
        Id = o.Id,
        OrderNumber = o.OrderNumber,
        UserId = o.UserId,
        Items = o.Items.Select(i => new OrderItemDto
        {
            ProductId = i.ProductId, Name = i.Name, Brand = i.Brand, Price = i.Price, Quantity = i.Quantity, Subtotal = i.Subtotal,
        }).ToList(),
        Subtotal = o.Subtotal,
        Tax = o.Tax,
        Shipping = o.Shipping,
        Discount = o.Discount,
        Total = o.Total,
        Address = JsonSerializer.Deserialize<AddressDto>(o.AddressJson)!,
        PaymentMethodId = o.PaymentMethodId,
        Status = o.Status,
        CreatedAt = o.CreatedAt,
        UpdatedAt = o.UpdatedAt,
        Custom = o.CustomFieldsJson == null ? null : JsonSerializer.Deserialize<Dictionary<string, object>>(o.CustomFieldsJson),
    };
}
