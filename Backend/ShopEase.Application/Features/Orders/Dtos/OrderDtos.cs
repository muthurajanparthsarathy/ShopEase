using System.ComponentModel.DataAnnotations;
using ShopEase.Application.Features.Auth.Dtos;

namespace ShopEase.Application.Features.Orders.Dtos;

public class OrderItemDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
}

public class OrderDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int UserId { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Shipping { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public AddressDto Address { get; set; } = null!;
    public int PaymentMethodId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Dictionary<string, object>? Custom { get; set; }
}

public class PlaceOrderRequest
{
    [Required]
    public int AddressId { get; set; }

    [Required]
    public int PaymentMethodId { get; set; }
}

public class UpdateOrderStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}

public class SetOrderCustomFieldsRequest
{
    public Dictionary<string, object> Custom { get; set; } = new();
}

public class OrderFiltersQuery
{
    public string? Status { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public int? CustomerId { get; set; }
}
