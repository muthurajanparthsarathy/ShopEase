using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly ShopEaseDbContext _db;

    public ProductRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<Product>> GetAllAsync() => _db.Products.AsNoTracking().OrderBy(p => p.Id).ToListAsync();

    // AsNoTracking, matching GetAllAsync: UpdateAsync always explicitly reattaches via .Update(),
    // so nothing here relies on change-tracking — and this avoids identity-map conflicts if a
    // caller fetches this product both individually and via GetAllAsync within the same DbContext.
    public Task<Product?> GetByIdAsync(int id) => _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);

    // SKUs are stored uppercase (ProductService normalizes on write), so compare plainly against
    // the column — index-seekable via IX_Products_Sku, and it keeps the duplicate guard meaningful
    // now that PostgreSQL's unique index is case-sensitive and no longer rejects EL-001 vs el-001.
    public Task<bool> ExistsWithSkuAsync(string sku, int? excludeId = null)
    {
        var normalized = sku.Trim().ToUpperInvariant();
        return _db.Products.AnyAsync(p => p.Sku == normalized && (excludeId == null || p.Id != excludeId));
    }

    public async Task<Product> AddAsync(Product product)
    {
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product;
    }

    public async Task UpdateAsync(Product product)
    {
        _db.Products.Update(product);
        await _db.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return false;
        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return true;
    }

    public Task<int> CountByCategoryAsync(int categoryId) =>
        _db.Products.CountAsync(p => p.CategoryId == categoryId);

    // Both halves were collation-sensitive. Under SQL Server's CI collation DISTINCT collapsed
    // "Sony" and "SONY" into one facet and the sort ignored case; PostgreSQL would split them into
    // two filter entries and (under LC_COLLATE=C) sort all uppercase first. Deduplicating and
    // sorting in memory, case-insensitively, reproduces the original facet list exactly.
    public async Task<List<string>> GetDistinctBrandsAsync()
    {
        var brands = await _db.Products.Where(p => p.IsActive).Select(p => p.Brand).ToListAsync();
        return brands
            .Where(b => !string.IsNullOrWhiteSpace(b))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(b => b, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
