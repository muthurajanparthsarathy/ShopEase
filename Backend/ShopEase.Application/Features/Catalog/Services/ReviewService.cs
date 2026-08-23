using ShopEase.Application.Common;
using ShopEase.Application.Features.Catalog.Dtos;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Catalog.Services;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviews;

    public ReviewService(IReviewRepository reviews) => _reviews = reviews;

    public async Task<List<ReviewDto>> GetForProductAsync(int productId) =>
        (await _reviews.GetForProductAsync(productId)).Select(ToDto).ToList();

    public async Task<ReviewStatsDto> GetStatsAsync(int productId)
    {
        var reviews = await _reviews.GetForProductAsync(productId);
        return Stats(reviews);
    }

    public async Task<Dictionary<int, ReviewStatsDto>> GetStatsForAllAsync()
    {
        var all = await _reviews.GetAllAsync();
        return all.GroupBy(r => r.ProductId).ToDictionary(g => g.Key, g => Stats(g.ToList()));
    }

    public Task<bool> HasReviewedAsync(int userId, int productId) => _reviews.HasReviewedAsync(userId, productId);

    public async Task<Result<ReviewDto>> AddAsync(ReviewCreateRequest request, int userId, string userName)
    {
        var review = new Review
        {
            ProductId = request.ProductId,
            UserId = userId,
            UserName = userName,
            Rating = request.Rating,
            Comment = request.Comment ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
        };

        await _reviews.AddAsync(review);
        return Result<ReviewDto>.Ok(ToDto(review), "Review submitted. Thank you!");
    }

    private static ReviewStatsDto Stats(List<Review> reviews) => reviews.Count == 0
        ? new ReviewStatsDto { Avg = 0, Count = 0 }
        : new ReviewStatsDto { Avg = Math.Round(reviews.Average(r => r.Rating), 1), Count = reviews.Count };

    private static ReviewDto ToDto(Review r) => new()
    {
        Id = r.Id,
        ProductId = r.ProductId,
        UserId = r.UserId,
        UserName = r.UserName,
        Rating = r.Rating,
        Comment = r.Comment,
        CreatedAt = r.CreatedAt,
    };
}
