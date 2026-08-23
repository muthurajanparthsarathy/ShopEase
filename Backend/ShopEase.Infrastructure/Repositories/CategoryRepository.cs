using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly ShopEaseDbContext _db;

    public CategoryRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<Category>> GetAllAsync() => _db.Categories.AsNoTracking().OrderBy(c => c.Id).ToListAsync();

    public Task<Category?> GetByIdAsync(int id) => _db.Categories.FirstOrDefaultAsync(c => c.Id == id);

    public Task<bool> ExistsWithNameAsync(string name, int? excludeId = null) =>
        _db.Categories.AnyAsync(c => c.IsActive && c.Name.ToLower() == name.ToLower() && (excludeId == null || c.Id != excludeId));

    public async Task<Category> AddAsync(Category category)
    {
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return category;
    }

    public async Task UpdateAsync(Category category)
    {
        _db.Categories.Update(category);
        await _db.SaveChangesAsync();
    }
}
