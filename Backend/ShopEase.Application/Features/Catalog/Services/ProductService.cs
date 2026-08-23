using System.Text.Json;
using ShopEase.Application.Abstractions;
using ShopEase.Application.Common;
using ShopEase.Application.Features.Catalog.Dtos;
using ShopEase.Domain.Features.Audit.Entities;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Catalog.Services;

public class ProductService : IProductService
{
    private const string ListCacheKey = "products:all";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    private readonly IProductRepository _products;
    private readonly ICacheService _cache;
    private readonly IAuditLogRepository _auditLogs;
    private readonly ICurrentUserService _currentUser;

    public ProductService(IProductRepository products, ICacheService cache, IAuditLogRepository auditLogs, ICurrentUserService currentUser)
    {
        _products = products;
        _cache = cache;
        _auditLogs = auditLogs;
        _currentUser = currentUser;
    }

    public async Task<List<ProductDto>> GetAllAsync()
    {
        if (_cache.TryGet<List<ProductDto>>(ListCacheKey, out var cached) && cached != null) return cached;

        var products = await _products.GetAllAsync();
        var dtos = products.Select(ToDto).ToList();
        _cache.Set(ListCacheKey, dtos, CacheTtl);
        return dtos;
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await _products.GetByIdAsync(id);
        return product == null ? null : ToDto(product);
    }

    public async Task<Result<ProductDto>> AddAsync(ProductCreateRequest request)
    {
        if (await _products.ExistsWithSkuAsync(request.Sku))
            return Result<ProductDto>.Fail("A product with this SKU already exists.");

        var product = new Product
        {
            Name = request.Name,
            Brand = request.Brand,
            // Uppercased on write so IX_Products_Sku still rejects EL-001 vs el-001 now that
            // PostgreSQL's unique index is case-sensitive.
            Sku = request.Sku.Trim().ToUpperInvariant(),
            Price = request.Price,
            Stock = request.Stock,
            CategoryId = request.CategoryId,
            Description = request.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CustomFieldsJson = Serialize(request.Custom),
        };

        await _products.AddAsync(product);
        _cache.Remove(ListCacheKey);
        await AuditAsync("ProductCreated", "Product", product.Id.ToString(), $"{product.Name} ({product.Sku})");

        return Result<ProductDto>.Ok(ToDto(product), "Product added successfully.");
    }

    public async Task<Result<ProductDto>> UpdateAsync(int id, ProductUpdateRequest request)
    {
        var product = await _products.GetByIdAsync(id);
        if (product == null) return Result<ProductDto>.Fail("Product not found.");

        if (request.Sku != null && !request.Sku.Equals(product.Sku, StringComparison.OrdinalIgnoreCase)
            && await _products.ExistsWithSkuAsync(request.Sku, id))
        {
            return Result<ProductDto>.Fail("Another product with this SKU already exists.");
        }

        if (request.Name != null) product.Name = request.Name;
        if (request.Brand != null) product.Brand = request.Brand;
        if (request.Sku != null) product.Sku = request.Sku.Trim().ToUpperInvariant();
        if (request.Price != null) product.Price = request.Price.Value;
        if (request.Stock != null) product.Stock = request.Stock.Value;
        if (request.CategoryId != null) product.CategoryId = request.CategoryId.Value;
        if (request.Description != null) product.Description = request.Description;
        if (request.IsActive != null) product.IsActive = request.IsActive.Value;
        if (request.Custom != null) product.CustomFieldsJson = Serialize(request.Custom);

        await _products.UpdateAsync(product);
        _cache.Remove(ListCacheKey);
        await AuditAsync("ProductUpdated", "Product", product.Id.ToString(), product.Name);

        return Result<ProductDto>.Ok(ToDto(product), "Product updated successfully.");
    }

    public async Task<Result> DeleteAsync(int id)
    {
        var product = await _products.GetByIdAsync(id);
        var deleted = await _products.DeleteAsync(id);
        if (!deleted) return Result.Fail("Product not found.");

        _cache.Remove(ListCacheKey);
        await AuditAsync("ProductDeleted", "Product", id.ToString(), product?.Name);
        return Result.Ok("Product deleted successfully.");
    }

    private Task AuditAsync(string action, string entity, string entityId, string? details) =>
        _auditLogs.AddAsync(new AuditLog
        {
            UserId = _currentUser.UserId,
            Action = action,
            Entity = entity,
            EntityId = entityId,
            IpAddress = _currentUser.IpAddress,
            Details = details,
        });

    private static string? Serialize(Dictionary<string, object>? custom) =>
        custom == null || custom.Count == 0 ? null : JsonSerializer.Serialize(custom);

    private static ProductDto ToDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Brand = p.Brand,
        Sku = p.Sku,
        Price = p.Price,
        Stock = p.Stock,
        CategoryId = p.CategoryId,
        Description = p.Description,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt,
        Custom = p.CustomFieldsJson == null ? null : JsonSerializer.Deserialize<Dictionary<string, object>>(p.CustomFieldsJson),
    };
}
