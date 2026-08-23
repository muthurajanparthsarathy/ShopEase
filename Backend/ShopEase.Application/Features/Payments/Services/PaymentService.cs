using System.Text.Json;
using ShopEase.Application.Abstractions;
using ShopEase.Application.Common;
using ShopEase.Application.Features.Notifications.Services;
using ShopEase.Application.Features.Payments.Dtos;
using ShopEase.Domain.Features.Payments.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Payments.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _payments;
    private readonly IPaymentGateway _gateway;
    private readonly INotificationService _notifications;

    public PaymentService(IPaymentRepository payments, IPaymentGateway gateway, INotificationService notifications)
    {
        _payments = payments;
        _gateway = gateway;
        _notifications = notifications;
    }

    public async Task<List<PaymentDto>> GetAllAsync() => (await _payments.GetAllAsync()).Select(ToDto).ToList();

    public async Task<List<PaymentDto>> GetByUserIdAsync(int userId) =>
        (await _payments.GetByUserIdAsync(userId)).Select(ToDto).ToList();

    public async Task<PaymentDto?> GetByOrderIdAsync(int orderId)
    {
        var payment = await _payments.GetByOrderIdAsync(orderId);
        return payment == null ? null : ToDto(payment);
    }

    public async Task<Result<PaymentDto>> ProcessAsync(int userId, ProcessPaymentRequest request)
    {
        // Cash on Delivery never touches the gateway — nothing to charge yet.
        if (request.Method == "Cash on Delivery")
        {
            var codPayment = await PersistAsync(userId, request, "Pending", null, new PaymentDetailsDto());
            return Result<PaymentDto>.Ok(ToDto(codPayment), "Order placed. Pay on delivery.");
        }

        var chargeResult = await _gateway.ChargeAsync(
            new ChargeRequest(request.Method, request.Amount, request.CardNumber, request.CardHolder, request.UpiId),
            CancellationToken.None);

        // "Pending" (not "Failed") when the resilience pipeline exhausts retries — graceful degradation
        // to manual reconciliation rather than a hard failure the customer can't recover from.
        var status = chargeResult.Success ? "Completed" : "Pending";
        var details = MaskDetails(request.Method, request.CardNumber, request.CardHolder, request.UpiId);
        var payment = await PersistAsync(userId, request, status, chargeResult.TransactionId, details);

        if (chargeResult.Success)
        {
            await _notifications.NotifyPaymentCompletedAsync(userId, request.Amount, request.Method);
            return Result<PaymentDto>.Ok(ToDto(payment), "Payment successful!");
        }

        await _notifications.NotifyPaymentFailedAsync(userId, request.Amount, request.Method);
        return new Result<PaymentDto>
        {
            Success = false,
            Message = "Payment could not be confirmed right now. It's marked pending for reconciliation — please check order status shortly.",
            Data = ToDto(payment),
        };
    }

    public async Task<List<PaymentMethodDto>> GetMethodsAsync() =>
        (await _payments.GetMethodsAsync()).Select(m => new PaymentMethodDto { Id = m.Id, Name = m.Name }).ToList();

    public List<PaymentDto> ApplyFilters(
        List<PaymentDto> payments, string? method, string? status, DateTime? dateFrom, DateTime? dateTo, decimal? minAmount, decimal? maxAmount)
    {
        IEnumerable<PaymentDto> result = payments;
        if (!string.IsNullOrEmpty(method)) result = result.Where(p => p.Method == method);
        if (!string.IsNullOrEmpty(status)) result = result.Where(p => p.Status == status);
        if (dateFrom != null) result = result.Where(p => p.CreatedAt >= dateFrom);
        if (dateTo != null) { var to = dateTo.Value.Date.AddDays(1).AddTicks(-1); result = result.Where(p => p.CreatedAt <= to); }
        if (minAmount != null) result = result.Where(p => p.Amount >= minAmount);
        if (maxAmount != null) result = result.Where(p => p.Amount <= maxAmount);
        return result.OrderByDescending(p => p.CreatedAt).ToList();
    }

    private async Task<Payment> PersistAsync(int userId, ProcessPaymentRequest request, string status, string? transactionId, PaymentDetailsDto details)
    {
        var payment = new Payment
        {
            OrderId = request.OrderId,
            UserId = userId,
            Method = request.Method,
            Amount = request.Amount,
            Status = status,
            TransactionId = transactionId,
            DetailsJson = JsonSerializer.Serialize(details),
            CreatedAt = DateTime.UtcNow,
        };

        await _payments.AddAsync(payment);
        return payment;
    }

    private static PaymentDetailsDto MaskDetails(string method, string? cardNumber, string? cardHolder, string? upiId)
    {
        if (method == "Credit Card" && !string.IsNullOrEmpty(cardNumber))
        {
            return new PaymentDetailsDto
            {
                CardLast4 = cardNumber.Length >= 4 ? cardNumber[^4..] : cardNumber,
                CardHolder = cardHolder ?? string.Empty,
            };
        }
        if (method == "UPI" && !string.IsNullOrEmpty(upiId)) return new PaymentDetailsDto { UpiId = upiId };
        return new PaymentDetailsDto();
    }

    private static PaymentDto ToDto(Payment p) => new()
    {
        Id = p.Id,
        OrderId = p.OrderId,
        UserId = p.UserId,
        Method = p.Method,
        Amount = p.Amount,
        Status = p.Status,
        TransactionId = p.TransactionId,
        Details = p.DetailsJson == null ? new PaymentDetailsDto() : JsonSerializer.Deserialize<PaymentDetailsDto>(p.DetailsJson)!,
        CreatedAt = p.CreatedAt,
    };
}
