using System.ComponentModel.DataAnnotations;

namespace ShopEase.Application.Features.Auth.Dtos;

public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<AddressDto> Addresses { get; set; } = new();
}

public class UpdateProfileRequest
{
    [Required, MinLength(2)]
    public string Name { get; set; } = string.Empty;

    [Required, RegularExpression(@"^(\+91[\s\-]?|0)?[6-9]\d{9}$", ErrorMessage = "Enter a valid Indian mobile number (e.g., 9876543210)")]
    public string Phone { get; set; } = string.Empty;
}
