using System.Text.RegularExpressions;
using ShopEase.Application.Common;
using ShopEase.Application.Features.CustomFields.Dtos;
using ShopEase.Domain.Features.CustomFields.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.CustomFields.Services;

public partial class CustomFieldService : ICustomFieldService
{
    private readonly ICustomFieldRepository _fields;

    public CustomFieldService(ICustomFieldRepository fields) => _fields = fields;

    public async Task<List<CustomFieldDto>> GetForEntityAsync(string entity, bool includeInactive)
    {
        // Entity is stored lowercase; normalize the lookup so "Product" and "product" agree.
        var normalizedEntity = entity.Trim().ToLowerInvariant();
        var all = await _fields.GetAllAsync();
        return all
            .Where(f => f.Entity == normalizedEntity && (includeInactive || f.Active))
            .Select(ToDto)
            .ToList();
    }

    public async Task<Result<CustomFieldDto>> AddAsync(CustomFieldCreateRequest request)
    {
        var key = await GenerateUniqueKeyAsync(request.Entity, request.Label);

        var field = new CustomField
        {
            Key = key,
            Label = request.Label,
            // Normalized on write. The duplicate probe behind GenerateUniqueKeyAsync compares
            // Entity server-side; un-normalized casing made it miss, so a second "Warranty"
            // field on Products silently reused the same Key instead of getting _2.
            Entity = request.Entity.Trim().ToLowerInvariant(),
            Type = request.Type,
            OptionsJson = System.Text.Json.JsonSerializer.Serialize(request.Options),
            Required = request.Required,
            Active = true,
            CreatedAt = DateTime.UtcNow,
        };

        await _fields.AddAsync(field);
        return Result<CustomFieldDto>.Ok(ToDto(field), "Custom field added.");
    }

    public async Task<Result<CustomFieldDto>> UpdateAsync(int id, CustomFieldUpdateRequest request)
    {
        var field = await _fields.GetByIdAsync(id);
        if (field == null) return Result<CustomFieldDto>.Fail("Custom field not found.");

        if (request.Label != null) field.Label = request.Label;
        if (request.Options != null) field.OptionsJson = System.Text.Json.JsonSerializer.Serialize(request.Options);
        if (request.Required != null) field.Required = request.Required.Value;
        if (request.Active != null) field.Active = request.Active.Value;

        await _fields.UpdateAsync(field);
        return Result<CustomFieldDto>.Ok(ToDto(field), "Custom field updated.");
    }

    public async Task<Result> DeleteAsync(int id)
    {
        var field = await _fields.GetByIdAsync(id);
        if (field == null) return Result.Fail("Custom field not found.");

        await _fields.DeleteAsync(id);
        return Result.Ok("Custom field deleted.");
    }

    public async Task<Result<CustomFieldDto>> ToggleActiveAsync(int id)
    {
        var field = await _fields.GetByIdAsync(id);
        if (field == null) return Result<CustomFieldDto>.Fail("Custom field not found.");

        field.Active = !field.Active;
        await _fields.UpdateAsync(field);
        return Result<CustomFieldDto>.Ok(ToDto(field));
    }

    private async Task<string> GenerateUniqueKeyAsync(string entity, string label)
    {
        var baseKey = Slugify(label);
        var key = baseKey;
        var n = 1;
        while (await _fields.ExistsWithKeyAsync(entity, key)) key = $"{baseKey}_{++n}";
        return key;
    }

    private static string Slugify(string label)
    {
        var slug = NonAlphaNumeric().Replace((label ?? string.Empty).ToLowerInvariant().Trim(), "_").Trim('_');
        return string.IsNullOrEmpty(slug) ? $"field_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}" : slug;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphaNumeric();

    private static CustomFieldDto ToDto(CustomField f) => new()
    {
        Id = f.Id,
        Key = f.Key,
        Label = f.Label,
        Entity = f.Entity,
        Type = f.Type,
        Options = System.Text.Json.JsonSerializer.Deserialize<List<string>>(f.OptionsJson) ?? new(),
        Required = f.Required,
        Active = f.Active,
        CreatedAt = f.CreatedAt,
    };
}
