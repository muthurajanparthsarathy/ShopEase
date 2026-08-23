using Microsoft.EntityFrameworkCore;
using ShopEase.Application.Features.Catalog.Dtos;
using ShopEase.Application.Features.Catalog.Services;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Catalog;

public class CategoryServiceTests
{
    private ShopEaseDbContext _db = null!;
    private CategoryService _categories = null!;
    private ProductService _products = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);
        var productRepo = new ProductRepository(_db);
        var auditLogs = new AuditLogRepository(_db);
        var currentUser = new NoopCurrentUserService();
        _categories = new CategoryService(new CategoryRepository(_db), productRepo, new NoopCacheService(), auditLogs, currentUser);
        _products = new ProductService(productRepo, new NoopCacheService(), auditLogs, currentUser);
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    [Test]
    public async Task Add_DuplicateName_CaseInsensitive_Fails()
    {
        await _categories.AddAsync(new CategoryCreateRequest { Name = "Electronics" });
        var second = await _categories.AddAsync(new CategoryCreateRequest { Name = "electronics" });

        Assert.That(second.Success, Is.False);
        Assert.That(second.Message, Does.Contain("already exists"));
    }

    [Test]
    public async Task Delete_BlockedWhileProductsReferenceIt()
    {
        var category = await _categories.AddAsync(new CategoryCreateRequest { Name = "Electronics" });
        await _products.AddAsync(new ProductCreateRequest
        {
            Name = "Mouse", Brand = "Logitech", Sku = "SKU-1", Price = 10, Stock = 1, CategoryId = category.Data!.Id,
        });

        var delete = await _categories.DeleteAsync(category.Data.Id);

        Assert.That(delete.Success, Is.False);
        Assert.That(delete.Message, Does.Contain("Cannot delete"));
    }

    [Test]
    public async Task Delete_SucceedsWhenNoProductsReferenceIt()
    {
        var category = await _categories.AddAsync(new CategoryCreateRequest { Name = "Electronics" });

        var delete = await _categories.DeleteAsync(category.Data!.Id);

        Assert.That(delete.Success, Is.True);
        var fetched = await _categories.GetByIdAsync(category.Data.Id);
        Assert.That(fetched!.IsActive, Is.False);
    }
}
