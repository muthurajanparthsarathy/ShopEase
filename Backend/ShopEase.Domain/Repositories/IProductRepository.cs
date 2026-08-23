using ShopEase.Domain.Features.Catalog.Entities;

namespace ShopEase.Domain.Repositories;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<bool> ExistsWithSkuAsync(string sku, int? excludeId = null);
    Task<Product> AddAsync(Product product);
    Task UpdateAsync(Product product);
    Task<bool> DeleteAsync(int id);
    Task<int> CountByCategoryAsync(int categoryId);
    Task<List<string>> GetDistinctBrandsAsync();
}
