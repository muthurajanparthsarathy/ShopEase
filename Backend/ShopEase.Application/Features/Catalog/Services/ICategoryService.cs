using ShopEase.Application.Common;
using ShopEase.Application.Features.Catalog.Dtos;

namespace ShopEase.Application.Features.Catalog.Services;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync();
    Task<CategoryDto?> GetByIdAsync(int id);
    Task<Result<CategoryDto>> AddAsync(CategoryCreateRequest request);
    Task<Result<CategoryDto>> UpdateAsync(int id, CategoryUpdateRequest request);
    Task<Result> DeleteAsync(int id);
}
