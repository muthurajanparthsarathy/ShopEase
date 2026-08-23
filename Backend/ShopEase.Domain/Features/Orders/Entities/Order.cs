using System.Text.Json.Serialization;
using ShopEase.Domain.Features.Auth.Entities;

namespace ShopEase.Domain.Features.Orders.Entities;

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int UserId { get; set; }
    public User? User { get; set; }
    public List<OrderItem> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Shipping { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }

    /// <summary>Address snapshot at order time (JSON) — intentionally not an FK, since the customer's saved address can change later.</summary>
    public string AddressJson { get; set; } = string.Empty;

    public int PaymentMethodId { get; set; }

    /// <summary>References OrderStatusLookup.Name — kept as a string (not an enum) since admins manage statuses as live lookups.</summary>
    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CustomFieldsJson { get; set; }
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }

    /// <summary>Back-reference for EF navigation only — ignored in JSON so exporting Orders (which
    /// includes Items) doesn't hit a serialization cycle (Order → Items → Order → ...).</summary>
    [JsonIgnore]
    public Order? Order { get; set; }
    public int ProductId { get; set; }

    // Denormalized order-time snapshot — matches the original app's behavior of freezing name/brand/price
    // at purchase time, independent of later product edits.
    public string Name { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
}
