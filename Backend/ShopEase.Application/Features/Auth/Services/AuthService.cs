using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using ShopEase.Application.Abstractions;
using ShopEase.Application.Common;
using ShopEase.Application.Features.Auth.Dtos;
using ShopEase.Application.Options;
using ShopEase.Domain.Enums;
using ShopEase.Domain.Features.Audit.Entities;
using ShopEase.Domain.Features.Auth.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IRefreshTokenRepository _refreshTokens;
    private readonly IAuditLogRepository _auditLogs;
    private readonly IJwtTokenGenerator _tokenGenerator;
    private readonly JwtOptions _jwtOptions;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public AuthService(
        IUserRepository users,
        IRefreshTokenRepository refreshTokens,
        IAuditLogRepository auditLogs,
        IJwtTokenGenerator tokenGenerator,
        IOptions<JwtOptions> jwtOptions)
    {
        _users = users;
        _refreshTokens = refreshTokens;
        _auditLogs = auditLogs;
        _tokenGenerator = tokenGenerator;
        _jwtOptions = jwtOptions.Value;
    }

    public async Task<Result<AuthResponseDto>> RegisterAsync(RegisterRequest request, string? ipAddress, string? deviceInfo)
    {
        var existing = await _users.GetByEmailAsync(request.Email);
        if (existing != null) return Result<AuthResponseDto>.Fail("An account with this email already exists.");

        var user = new User
        {
            Name = request.Name,
            // Normalized on write. Under SQL Server's case-insensitive collation the unique index
            // on Email physically refused "Priya@Example.com" when "priya@example.com" existed;
            // PostgreSQL accepts both. Lowercasing here is what keeps that guarantee.
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone,
            RoleId = RoleId.Customer,
            IsActive = true,
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        await _users.AddAsync(user);
        await _auditLogs.AddAsync(new AuditLog { UserId = user.Id, Action = "Register", IpAddress = ipAddress });

        return Result<AuthResponseDto>.Ok(await IssueTokensAsync(user, ipAddress, deviceInfo), "Account created!");
    }

    public async Task<Result<AuthResponseDto>> LoginAsync(LoginRequest request, string? ipAddress, string? deviceInfo)
    {
        var user = await _users.GetByEmailAsync(request.Email);
        if (user == null) return Result<AuthResponseDto>.Fail("Invalid email or password.");
        if (!user.IsActive) return Result<AuthResponseDto>.Fail("Your account has been deactivated. Contact admin.");

        var verify = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verify == PasswordVerificationResult.Failed) return Result<AuthResponseDto>.Fail("Invalid email or password.");

        if (verify == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
            await _users.UpdateAsync(user);
        }

        await _auditLogs.AddAsync(new AuditLog { UserId = user.Id, Action = "Login", IpAddress = ipAddress });

        return Result<AuthResponseDto>.Ok(await IssueTokensAsync(user, ipAddress, deviceInfo), "Welcome back!");
    }

    public async Task<Result<AuthResponseDto>> RefreshAsync(string refreshToken, string? ipAddress, string? deviceInfo)
    {
        var hash = HashToken(refreshToken);
        var existing = await _refreshTokens.GetByHashAsync(hash);
        if (existing == null || !existing.IsActive) return Result<AuthResponseDto>.Fail("Session expired. Please log in again.");

        var user = await _users.GetByIdAsync(existing.UserId);
        if (user == null || !user.IsActive) return Result<AuthResponseDto>.Fail("Session expired. Please log in again.");

        var response = await IssueTokensAsync(user, ipAddress, deviceInfo);

        // Rotate: the old token is revoked and points at its replacement, so reuse of a stolen/rotated token is detectable.
        existing.RevokedAt = DateTime.UtcNow;
        existing.ReplacedByTokenHash = HashToken(response.RefreshToken);
        await _refreshTokens.SaveChangesAsync();

        return Result<AuthResponseDto>.Ok(response);
    }

    public async Task<Result> LogoutAsync(string refreshToken)
    {
        var hash = HashToken(refreshToken);
        var existing = await _refreshTokens.GetByHashAsync(hash);
        if (existing == null) return Result.Ok("Logged out.");

        existing.RevokedAt = DateTime.UtcNow;
        await _refreshTokens.SaveChangesAsync();
        await _auditLogs.AddAsync(new AuditLog { UserId = existing.UserId, Action = "Logout" });

        return Result.Ok("Logged out.");
    }

    public async Task<Result> LogoutAllAsync(int userId)
    {
        await _refreshTokens.RevokeAllForUserAsync(userId);
        await _auditLogs.AddAsync(new AuditLog { UserId = userId, Action = "LogoutAll" });
        return Result.Ok("Logged out of all devices.");
    }

    private async Task<AuthResponseDto> IssueTokensAsync(User user, string? ipAddress, string? deviceInfo)
    {
        var accessToken = _tokenGenerator.GenerateAccessToken(user);
        var refreshToken = _tokenGenerator.GenerateRefreshToken();

        await _refreshTokens.AddAsync(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(refreshToken),
            DeviceInfo = deviceInfo,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpiryDays),
        });

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new SessionUserDto { Id = user.Id, Name = user.Name, Email = user.Email, RoleId = (int)user.RoleId },
        };
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
