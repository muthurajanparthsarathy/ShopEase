using System.ComponentModel.DataAnnotations;

namespace ShopEase.Application.Features.Auth.Dtos;

public class AddressDto
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Line { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class AddressRequest
{
    [Required]
    public string Label { get; set; } = string.Empty;

    [Required]
    public string Line { get; set; } = string.Empty;

    [Required]
    public string City { get; set; } = string.Empty;

    [Required]
    public string State { get; set; } = string.Empty;

    [Required, RegularExpression(@"^\d{6}$", ErrorMessage = "Enter a valid 6-digit postal code")]
    public string PostalCode { get; set; } = string.Empty;
}
