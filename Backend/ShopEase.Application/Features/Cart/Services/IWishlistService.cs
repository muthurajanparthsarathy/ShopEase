namespace ShopEase.Application.Features.Cart.Services;

public interface IWishlistService
{
    Task<List<int>> GetIdsAsync(int userId);
    Task<bool> HasAsync(int userId, int productId);
    Task<bool> ToggleAsync(int userId, int productId);
    Task RemoveAsync(int userId, int productId);
    Task<int> CountAsync(int userId);
}
