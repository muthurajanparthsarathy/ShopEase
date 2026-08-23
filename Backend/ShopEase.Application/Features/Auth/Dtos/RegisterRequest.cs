using System.ComponentModel.DataAnnotations;

namespace ShopEase.Application.Features.Auth.Dtos;

public class RegisterRequest
{
    [Required, MinLength(2)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, RegularExpression(@"^(\+91[\s\-]?|0)?[6-9]\d{9}$", ErrorMessage = "Enter a valid Indian mobile number (e.g., 9876543210)")]
    public string Phone { get; set; } = string.Empty;

    [Required, RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>/?]).{6,}$",
        ErrorMessage = "Min 6 chars with uppercase, lowercase, digit, and special character")]
    public string Password { get; set; } = string.Empty;
}
