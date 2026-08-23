using ShopEase.Domain.Features.Catalog.Entities;

namespace ShopEase.Domain.Repositories;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(int id);
    Task<bool> ExistsWithNameAsync(string name, int? excludeId = null);
    Task<Category> AddAsync(Category category);
    Task UpdateAsync(Category category);
}
