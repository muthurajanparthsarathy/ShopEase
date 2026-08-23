using ShopEase.Application.Common;
using ShopEase.Application.Features.Catalog.Dtos;

namespace ShopEase.Application.Features.Catalog.Services;

public interface IProductService
{
    Task<List<ProductDto>> GetAllAsync();
    Task<ProductDto?> GetByIdAsync(int id);
    Task<Result<ProductDto>> AddAsync(ProductCreateRequest request);
    Task<Result<ProductDto>> UpdateAsync(int id, ProductUpdateRequest request);
    Task<Result> DeleteAsync(int id);
}
