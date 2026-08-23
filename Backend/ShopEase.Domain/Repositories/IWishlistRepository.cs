namespace ShopEase.Domain.Repositories;

public interface IWishlistRepository
{
    Task<List<int>> GetProductIdsAsync(int userId);
    Task<bool> ExistsAsync(int userId, int productId);
    Task AddAsync(int userId, int productId);
    Task RemoveAsync(int userId, int productId);
}
