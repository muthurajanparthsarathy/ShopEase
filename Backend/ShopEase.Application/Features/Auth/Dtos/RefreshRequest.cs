using System.ComponentModel.DataAnnotations;

namespace ShopEase.Application.Features.Auth.Dtos;

public class RefreshRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
