namespace ShopEase.Domain.Features.Payments.Entities;

/// <summary>Admin-manageable list of valid payment statuses (Payment.Status references Name, not a hard FK).</summary>
public class PaymentStatusLookup
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
