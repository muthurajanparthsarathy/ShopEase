using ShopEase.Domain.Features.Cart.Entities;

namespace ShopEase.Domain.Repositories;

public interface ICartRepository
{
    Task<List<CartItem>> GetItemsAsync(int userId, bool saved);
    Task<CartItem?> GetItemAsync(int userId, int productId, bool saved);
    Task UpsertAsync(CartItem item);
    Task RemoveAsync(int userId, int productId, bool saved);
    Task ClearCartAsync(int userId);
}
