using ShopEase.Domain.Features.Auth.Entities;

namespace ShopEase.Application.Abstractions;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(User user);

    /// <summary>Cryptographically random opaque string — never a JWT. Caller hashes it before persisting.</summary>
    string GenerateRefreshToken();
}
