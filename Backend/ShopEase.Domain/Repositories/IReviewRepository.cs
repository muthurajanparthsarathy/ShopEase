using ShopEase.Domain.Features.Catalog.Entities;

namespace ShopEase.Domain.Repositories;

public interface IReviewRepository
{
    Task<List<Review>> GetAllAsync();
    Task<List<Review>> GetForProductAsync(int productId);
    Task<bool> HasReviewedAsync(int userId, int productId);
    Task<Review> AddAsync(Review review);
}
