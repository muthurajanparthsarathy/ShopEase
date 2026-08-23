namespace ShopEase.Application.Features.Auth.Dtos;

/// <summary>Mirrors the Angular app's SessionUser shape exactly — never includes the password hash.</summary>
public class SessionUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int RoleId { get; set; }
}
