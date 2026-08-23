using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ShopEase.Application.Features.Auth.Dtos;
using ShopEase.Application.Features.Auth.Services;
using ShopEase.Application.Options;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Auth;

public class AuthServiceTests
{
    private ShopEaseDbContext _db = null!;
    private AuthService _authService = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);

        // Fully qualified: this test namespace (ShopEase.Api.Tests.*) nests under ShopEase.Api, which
        // shadows the unqualified "Options" against the sibling ShopEase.Api.Options namespace.
        var jwtOptions = Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            SigningKey = "test-signing-key-that-is-at-least-32-bytes-long-for-hmac-sha256",
            AccessTokenExpiryMinutes = 15,
            RefreshTokenExpiryDays = 14,
        });

        var users = new UserRepository(_db);
        var refreshTokens = new RefreshTokenRepository(_db);
        var auditLogs = new AuditLogRepository(_db);
        var tokenGenerator = new JwtTokenGenerator(jwtOptions);

        _authService = new AuthService(users, refreshTokens, auditLogs, tokenGenerator, jwtOptions);
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    private static RegisterRequest ValidRegister(string email = "user@example.com") => new()
    {
        Name = "Test User",
        Email = email,
        Phone = "9876543210",
        Password = "Test@123",
    };

    [Test]
    public async Task Register_Then_Login_Succeeds()
    {
        var register = await _authService.RegisterAsync(ValidRegister(), null, null);
        Assert.That(register.Success, Is.True);

        var login = await _authService.LoginAsync(new LoginRequest { Email = "user@example.com", Password = "Test@123" }, null, null);

        Assert.That(login.Success, Is.True);
        Assert.That(login.Data!.User.Email, Is.EqualTo("user@example.com"));
    }

    [Test]
    public async Task Register_DuplicateEmail_Fails()
    {
        await _authService.RegisterAsync(ValidRegister(), null, null);
        var second = await _authService.RegisterAsync(ValidRegister(), null, null);

        Assert.That(second.Success, Is.False);
        Assert.That(second.Message, Does.Contain("already exists"));
    }

    [Test]
    public async Task Login_WrongPassword_Fails()
    {
        await _authService.RegisterAsync(ValidRegister(), null, null);
        var login = await _authService.LoginAsync(new LoginRequest { Email = "user@example.com", Password = "WrongPass1!" }, null, null);

        Assert.That(login.Success, Is.False);
        Assert.That(login.Message, Is.EqualTo("Invalid email or password."));
    }

    [Test]
    public async Task Refresh_RotatesToken_AndRejectsReuseOfOldToken()
    {
        var register = await _authService.RegisterAsync(ValidRegister(), null, null);
        var originalRefreshToken = register.Data!.RefreshToken;

        var refreshed = await _authService.RefreshAsync(originalRefreshToken, null, null);
        Assert.That(refreshed.Success, Is.True);
        Assert.That(refreshed.Data!.RefreshToken, Is.Not.EqualTo(originalRefreshToken));

        var reuse = await _authService.RefreshAsync(originalRefreshToken, null, null);
        Assert.That(reuse.Success, Is.False);
    }

    [Test]
    public async Task LogoutAll_RevokesEveryRefreshTokenForUser()
    {
        var register = await _authService.RegisterAsync(ValidRegister(), null, null);
        var userId = register.Data!.User.Id;

        // A second login from another "device" creates a second, independent active session.
        var secondLogin = await _authService.LoginAsync(
            new LoginRequest { Email = "user@example.com", Password = "Test@123" }, null, "device-2");

        await _authService.LogoutAllAsync(userId);

        var refreshAfterLogoutAll = await _authService.RefreshAsync(secondLogin.Data!.RefreshToken, null, null);
        Assert.That(refreshAfterLogoutAll.Success, Is.False);
    }
}
