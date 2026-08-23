namespace ShopEase.Domain.Features.Payments.Entities;

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int UserId { get; set; }
    public string Method { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    /// <summary>References PaymentStatusLookup.Name.</summary>
    public string Status { get; set; } = "Pending";

    public string? TransactionId { get; set; }
    public string? DetailsJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
