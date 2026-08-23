using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShopEase.Application.Features.Auth.Dtos;
using ShopEase.Application.Features.Auth.Services;

namespace ShopEase.Api.Features.Auth.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request, IpAddress(), DeviceInfo());
        if (!result.Success) return Conflict(Problem(result.Message, StatusCodes.Status409Conflict));
        return Ok(result.Data);
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request, IpAddress(), DeviceInfo());
        if (!result.Success) return Unauthorized(Problem(result.Message, StatusCodes.Status401Unauthorized));
        return Ok(result.Data);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(RefreshRequest request)
    {
        var result = await _authService.RefreshAsync(request.RefreshToken, IpAddress(), DeviceInfo());
        if (!result.Success) return Unauthorized(Problem(result.Message, StatusCodes.Status401Unauthorized));
        return Ok(result.Data);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request)
    {
        await _authService.LogoutAsync(request.RefreshToken);
        return NoContent();
    }

    [Authorize]
    [HttpPost("logout-all")]
    public async Task<IActionResult> LogoutAll()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _authService.LogoutAllAsync(userId);
        return NoContent();
    }

    private string? IpAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();
    private string? DeviceInfo() => Request.Headers.UserAgent.ToString();

    private static ProblemDetails Problem(string? message, int status) => new()
    {
        Status = status,
        Title = message ?? "Request failed.",
    };
}
