using ShopEase.Application.Abstractions;
using ShopEase.Application.Common;
using ShopEase.Application.Features.Catalog.Dtos;
using ShopEase.Domain.Features.Audit.Entities;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Catalog.Services;

public class CategoryService : ICategoryService
{
    private const string ListCacheKey = "categories:all";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(30);

    private readonly ICategoryRepository _categories;
    private readonly IProductRepository _products;
    private readonly ICacheService _cache;
    private readonly IAuditLogRepository _auditLogs;
    private readonly ICurrentUserService _currentUser;

    public CategoryService(
        ICategoryRepository categories, IProductRepository products, ICacheService cache,
        IAuditLogRepository auditLogs, ICurrentUserService currentUser)
    {
        _categories = categories;
        _products = products;
        _cache = cache;
        _auditLogs = auditLogs;
        _currentUser = currentUser;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        if (_cache.TryGet<List<CategoryDto>>(ListCacheKey, out var cached) && cached != null) return cached;

        var categories = await _categories.GetAllAsync();
        var dtos = categories.Select(ToDto).ToList();
        _cache.Set(ListCacheKey, dtos, CacheTtl);
        return dtos;
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var category = await _categories.GetByIdAsync(id);
        return category == null ? null : ToDto(category);
    }

    public async Task<Result<CategoryDto>> AddAsync(CategoryCreateRequest request)
    {
        if (await _categories.ExistsWithNameAsync(request.Name))
            return Result<CategoryDto>.Fail("A category with this name already exists.");

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };

        await _categories.AddAsync(category);
        _cache.Remove(ListCacheKey);
        await AuditAsync("CategoryCreated", category.Id.ToString(), category.Name);

        return Result<CategoryDto>.Ok(ToDto(category), "Category added successfully.");
    }

    public async Task<Result<CategoryDto>> UpdateAsync(int id, CategoryUpdateRequest request)
    {
        var category = await _categories.GetByIdAsync(id);
        if (category == null) return Result<CategoryDto>.Fail("Category not found.");

        if (request.Name != null && !request.Name.Equals(category.Name, StringComparison.OrdinalIgnoreCase)
            && await _categories.ExistsWithNameAsync(request.Name, id))
        {
            return Result<CategoryDto>.Fail("Another category with this name already exists.");
        }

        // Delete-protection: a category can't be deactivated while products still reference it.
        if (request.IsActive == false && category.IsActive)
        {
            var count = await _products.CountByCategoryAsync(id);
            if (count > 0) return Result<CategoryDto>.Fail($"Cannot delete: {count} product(s) belong to this category.");
        }

        if (request.Name != null) category.Name = request.Name;
        if (request.Description != null) category.Description = request.Description;
        if (request.IsActive != null) category.IsActive = request.IsActive.Value;

        await _categories.UpdateAsync(category);
        _cache.Remove(ListCacheKey);
        await AuditAsync(request.IsActive == false ? "CategoryDeleted" : "CategoryUpdated", category.Id.ToString(), category.Name);

        return Result<CategoryDto>.Ok(ToDto(category), "Category updated successfully.");
    }

    public async Task<Result> DeleteAsync(int id)
    {
        var result = await UpdateAsync(id, new CategoryUpdateRequest { IsActive = false });
        return result.Success ? Result.Ok("Category deleted successfully.") : Result.Fail(result.Message!);
    }

    private Task AuditAsync(string action, string entityId, string details) =>
        _auditLogs.AddAsync(new AuditLog
        {
            UserId = _currentUser.UserId,
            Action = action,
            Entity = "Category",
            EntityId = entityId,
            IpAddress = _currentUser.IpAddress,
            Details = details,
        });

    private static CategoryDto ToDto(Category c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        IsActive = c.IsActive,
        CreatedAt = c.CreatedAt,
    };
}
