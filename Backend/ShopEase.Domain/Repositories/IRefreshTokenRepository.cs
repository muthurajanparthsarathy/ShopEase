using ShopEase.Domain.Features.Auth.Entities;

namespace ShopEase.Domain.Repositories;

public interface IRefreshTokenRepository
{
    Task<RefreshToken> AddAsync(RefreshToken token);
    Task<RefreshToken?> GetByHashAsync(string tokenHash);
    Task RevokeAllForUserAsync(int userId);
    Task SaveChangesAsync();
}
