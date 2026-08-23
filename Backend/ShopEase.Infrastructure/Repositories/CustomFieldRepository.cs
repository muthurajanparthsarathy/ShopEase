using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.CustomFields.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class CustomFieldRepository : ICustomFieldRepository
{
    private readonly ShopEaseDbContext _db;

    public CustomFieldRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<CustomField>> GetAllAsync() => _db.CustomFields.AsNoTracking().ToListAsync();

    public Task<CustomField?> GetByIdAsync(int id) => _db.CustomFields.FirstOrDefaultAsync(f => f.Id == id);

    // Both halves normalized. Key was already safe by accident (Slugify lowercases); Entity was
    // not, and this is the probe that decides whether a duplicate label gets a _2 suffix.
    public Task<bool> ExistsWithKeyAsync(string entity, string key)
    {
        var e = entity.Trim().ToLowerInvariant();
        var k = key.Trim().ToLowerInvariant();
        return _db.CustomFields.AnyAsync(f => f.Entity == e && f.Key == k);
    }

    public async Task<CustomField> AddAsync(CustomField field)
    {
        _db.CustomFields.Add(field);
        await _db.SaveChangesAsync();
        return field;
    }

    public async Task UpdateAsync(CustomField field)
    {
        _db.CustomFields.Update(field);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var field = await _db.CustomFields.FindAsync(id);
        if (field == null) return;
        _db.CustomFields.Remove(field);
        await _db.SaveChangesAsync();
    }
}
