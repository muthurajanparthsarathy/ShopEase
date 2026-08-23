using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Cart.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class WishlistRepository : IWishlistRepository
{
    private readonly ShopEaseDbContext _db;

    public WishlistRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<int>> GetProductIdsAsync(int userId) =>
        _db.WishlistItems.AsNoTracking().Where(w => w.UserId == userId).Select(w => w.ProductId).ToListAsync();

    public Task<bool> ExistsAsync(int userId, int productId) =>
        _db.WishlistItems.AnyAsync(w => w.UserId == userId && w.ProductId == productId);

    public async Task AddAsync(int userId, int productId)
    {
        if (await ExistsAsync(userId, productId)) return;
        _db.WishlistItems.Add(new WishlistItem { UserId = userId, ProductId = productId });
        await _db.SaveChangesAsync();
    }

    public async Task RemoveAsync(int userId, int productId)
    {
        var item = await _db.WishlistItems.FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);
        if (item == null) return;
        _db.WishlistItems.Remove(item);
        await _db.SaveChangesAsync();
    }
}
