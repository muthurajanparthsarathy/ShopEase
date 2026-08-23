namespace ShopEase.Domain.Features.Payments.Entities;

public class PaymentMethod
{
    public int Id { get; set; }

    /// <summary>"Credit Card" | "UPI" | "Cash on Delivery".</summary>
    public string Name { get; set; } = string.Empty;
}
