using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Cart.Services;

public class WishlistService : IWishlistService
{
    private readonly IWishlistRepository _wishlist;

    public WishlistService(IWishlistRepository wishlist) => _wishlist = wishlist;

    public Task<List<int>> GetIdsAsync(int userId) => _wishlist.GetProductIdsAsync(userId);

    public Task<bool> HasAsync(int userId, int productId) => _wishlist.ExistsAsync(userId, productId);

    public async Task<bool> ToggleAsync(int userId, int productId)
    {
        var exists = await _wishlist.ExistsAsync(userId, productId);
        if (exists)
        {
            await _wishlist.RemoveAsync(userId, productId);
            return false;
        }

        await _wishlist.AddAsync(userId, productId);
        return true;
    }

    public Task RemoveAsync(int userId, int productId) => _wishlist.RemoveAsync(userId, productId);

    public async Task<int> CountAsync(int userId) => (await _wishlist.GetProductIdsAsync(userId)).Count;
}
