using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Auth.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ShopEaseDbContext _db;

    public RefreshTokenRepository(ShopEaseDbContext db) => _db = db;

    public async Task<RefreshToken> AddAsync(RefreshToken token)
    {
        _db.RefreshTokens.Add(token);
        await _db.SaveChangesAsync();
        return token;
    }

    public Task<RefreshToken?> GetByHashAsync(string tokenHash) =>
        _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

    public async Task RevokeAllForUserAsync(int userId)
    {
        var active = await _db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync();
        foreach (var token in active) token.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}
