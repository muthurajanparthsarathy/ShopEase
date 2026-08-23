using ShopEase.Application.Common;
using ShopEase.Application.Features.Auth.Dtos;

namespace ShopEase.Application.Features.Auth.Services;

public interface IAuthService
{
    Task<Result<AuthResponseDto>> RegisterAsync(RegisterRequest request, string? ipAddress, string? deviceInfo);
    Task<Result<AuthResponseDto>> LoginAsync(LoginRequest request, string? ipAddress, string? deviceInfo);
    Task<Result<AuthResponseDto>> RefreshAsync(string refreshToken, string? ipAddress, string? deviceInfo);
    Task<Result> LogoutAsync(string refreshToken);
    Task<Result> LogoutAllAsync(int userId);
}
