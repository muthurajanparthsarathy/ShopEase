using Microsoft.EntityFrameworkCore;
using ShopEase.Application.Features.Catalog.Dtos;
using ShopEase.Application.Features.Catalog.Services;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Catalog;

public class ProductServiceTests
{
    private ShopEaseDbContext _db = null!;
    private ProductService _products = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);
        _products = new ProductService(new ProductRepository(_db), new NoopCacheService(), new AuditLogRepository(_db), new NoopCurrentUserService());
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    private static ProductCreateRequest ValidProduct(string sku = "SKU-001") => new()
    {
        Name = "Wireless Mouse",
        Brand = "Logitech",
        Sku = sku,
        Price = 999.00m,
        Stock = 10,
        CategoryId = 1,
        Description = "Ergonomic",
    };

    [Test]
    public async Task Add_DuplicateSku_CaseInsensitive_Fails()
    {
        await _products.AddAsync(ValidProduct("SKU-001"));
        var second = await _products.AddAsync(ValidProduct("sku-001"));

        Assert.That(second.Success, Is.False);
        Assert.That(second.Message, Does.Contain("SKU already exists"));
    }

    [Test]
    public async Task Update_ToAnotherProductsSku_Fails()
    {
        await _products.AddAsync(ValidProduct("SKU-001"));
        var second = await _products.AddAsync(ValidProduct("SKU-002"));

        var update = await _products.UpdateAsync(second.Data!.Id, new ProductUpdateRequest { Sku = "SKU-001" });

        Assert.That(update.Success, Is.False);
        Assert.That(update.Message, Does.Contain("Another product"));
    }

    [Test]
    public async Task Update_CustomFields_RoundTripsThroughJson()
    {
        var created = await _products.AddAsync(ValidProduct());
        // AddAsync leaves the entity tracked; clearing here simulates the fresh DbContext a real
        // request would get, so the later GetByIdAsync (AsNoTracking) doesn't collide with it.
        _db.ChangeTracker.Clear();
        var update = await _products.UpdateAsync(created.Data!.Id, new ProductUpdateRequest
        {
            Custom = new Dictionary<string, object> { ["warrantyMonths"] = 12 },
        });

        Assert.That(update.Success, Is.True);
        var fetched = await _products.GetByIdAsync(created.Data.Id);
        Assert.That(fetched!.Custom, Is.Not.Null);
        Assert.That(fetched.Custom!.ContainsKey("warrantyMonths"), Is.True);
    }

    [Test]
    public async Task Delete_NonExistentProduct_Fails()
    {
        var result = await _products.DeleteAsync(999);
        Assert.That(result.Success, Is.False);
    }
}
