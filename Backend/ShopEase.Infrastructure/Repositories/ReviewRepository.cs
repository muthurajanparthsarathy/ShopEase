using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class ReviewRepository : IReviewRepository
{
    private readonly ShopEaseDbContext _db;

    public ReviewRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<Review>> GetAllAsync() => _db.Reviews.AsNoTracking().OrderBy(r => r.Id).ToListAsync();

    public Task<List<Review>> GetForProductAsync(int productId) =>
        _db.Reviews.AsNoTracking()
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .ToListAsync();

    public Task<bool> HasReviewedAsync(int userId, int productId) =>
        _db.Reviews.AnyAsync(r => r.UserId == userId && r.ProductId == productId);

    public async Task<Review> AddAsync(Review review)
    {
        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();
        return review;
    }
}
