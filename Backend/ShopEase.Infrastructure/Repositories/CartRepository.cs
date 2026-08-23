using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Cart.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private readonly ShopEaseDbContext _db;

    public CartRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<CartItem>> GetItemsAsync(int userId, bool saved) =>
        _db.CartItems.AsNoTracking().Where(c => c.UserId == userId && c.IsSaved == saved).ToListAsync();

    public Task<CartItem?> GetItemAsync(int userId, int productId, bool saved) =>
        _db.CartItems.FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId && c.IsSaved == saved);

    public async Task UpsertAsync(CartItem item)
    {
        var existing = await _db.CartItems.FirstOrDefaultAsync(
            c => c.UserId == item.UserId && c.ProductId == item.ProductId && c.IsSaved == item.IsSaved);

        if (existing == null)
        {
            _db.CartItems.Add(item);
        }
        else
        {
            existing.Quantity = item.Quantity;
        }

        await _db.SaveChangesAsync();
    }

    public async Task RemoveAsync(int userId, int productId, bool saved)
    {
        var item = await _db.CartItems.FirstOrDefaultAsync(
            c => c.UserId == userId && c.ProductId == productId && c.IsSaved == saved);
        if (item == null) return;
        _db.CartItems.Remove(item);
        await _db.SaveChangesAsync();
    }

    public async Task ClearCartAsync(int userId)
    {
        var items = await _db.CartItems.Where(c => c.UserId == userId && !c.IsSaved).ToListAsync();
        _db.CartItems.RemoveRange(items);
        await _db.SaveChangesAsync();
    }
}
