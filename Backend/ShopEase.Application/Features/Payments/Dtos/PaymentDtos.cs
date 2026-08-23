using System.ComponentModel.DataAnnotations;

namespace ShopEase.Application.Features.Payments.Dtos;

public class PaymentDetailsDto
{
    public string? CardLast4 { get; set; }
    public string? CardHolder { get; set; }
    public string? UpiId { get; set; }
}

public class PaymentDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int UserId { get; set; }
    public string Method { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public PaymentDetailsDto Details { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class ProcessPaymentRequest
{
    [Required]
    public int OrderId { get; set; }

    [Required]
    public string Method { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    public string? CardNumber { get; set; }
    public string? CardHolder { get; set; }
    public string? UpiId { get; set; }
}

public class PaymentMethodDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
