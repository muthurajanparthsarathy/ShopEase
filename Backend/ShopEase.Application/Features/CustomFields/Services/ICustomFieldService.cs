using ShopEase.Application.Common;
using ShopEase.Application.Features.CustomFields.Dtos;

namespace ShopEase.Application.Features.CustomFields.Services;

public interface ICustomFieldService
{
    Task<List<CustomFieldDto>> GetForEntityAsync(string entity, bool includeInactive);
    Task<Result<CustomFieldDto>> AddAsync(CustomFieldCreateRequest request);
    Task<Result<CustomFieldDto>> UpdateAsync(int id, CustomFieldUpdateRequest request);
    Task<Result> DeleteAsync(int id);
    Task<Result<CustomFieldDto>> ToggleActiveAsync(int id);
}
