using ShopEase.Application.Common;
using ShopEase.Application.Features.Catalog.Dtos;

namespace ShopEase.Application.Features.Catalog.Services;

public interface IReviewService
{
    Task<List<ReviewDto>> GetForProductAsync(int productId);
    Task<ReviewStatsDto> GetStatsAsync(int productId);
    Task<Dictionary<int, ReviewStatsDto>> GetStatsForAllAsync();
    Task<bool> HasReviewedAsync(int userId, int productId);
    Task<Result<ReviewDto>> AddAsync(ReviewCreateRequest request, int userId, string userName);
}
