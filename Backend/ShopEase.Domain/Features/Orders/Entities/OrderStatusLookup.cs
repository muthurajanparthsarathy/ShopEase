namespace ShopEase.Domain.Features.Orders.Entities;

/// <summary>Admin-manageable list of valid order statuses (Order.Status references Name, not a hard FK).</summary>
public class OrderStatusLookup
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
