using ShopEase.Domain.Features.CustomFields.Entities;

namespace ShopEase.Domain.Repositories;

public interface ICustomFieldRepository
{
    Task<List<CustomField>> GetAllAsync();
    Task<CustomField?> GetByIdAsync(int id);
    Task<bool> ExistsWithKeyAsync(string entity, string key);
    Task<CustomField> AddAsync(CustomField field);
    Task UpdateAsync(CustomField field);
    Task DeleteAsync(int id);
}
