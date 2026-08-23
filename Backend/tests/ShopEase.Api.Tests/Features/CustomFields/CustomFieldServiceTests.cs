using Microsoft.EntityFrameworkCore;
using ShopEase.Application.Features.CustomFields.Dtos;
using ShopEase.Application.Features.CustomFields.Services;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.CustomFields;

public class CustomFieldServiceTests
{
    private ShopEaseDbContext _db = null!;
    private CustomFieldService _fields = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);
        _fields = new CustomFieldService(new CustomFieldRepository(_db));
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    private static CustomFieldCreateRequest Request(string label = "Gift Wrap Available?") => new()
    {
        Label = label,
        Entity = "product",
        Type = "checkbox",
        Options = new List<string>(),
        Required = false,
    };

    [Test]
    public async Task Add_GeneratesSlugKeyFromLabel()
    {
        var result = await _fields.AddAsync(Request());

        Assert.That(result.Data!.Key, Is.EqualTo("gift_wrap_available"));
    }

    [Test]
    public async Task Add_CollidingLabel_GetsSuffixedKey()
    {
        var first = await _fields.AddAsync(Request());
        var second = await _fields.AddAsync(Request());

        Assert.That(first.Data!.Key, Is.EqualTo("gift_wrap_available"));
        Assert.That(second.Data!.Key, Is.EqualTo("gift_wrap_available_2"));
    }

    [Test]
    public async Task Add_SameKey_DifferentEntity_DoesNotCollide()
    {
        var productField = await _fields.AddAsync(Request());
        var orderField = await _fields.AddAsync(new CustomFieldCreateRequest
        {
            Label = "Gift Wrap Available?", Entity = "order", Type = "checkbox", Options = new List<string>(),
        });

        Assert.That(productField.Data!.Key, Is.EqualTo("gift_wrap_available"));
        Assert.That(orderField.Data!.Key, Is.EqualTo("gift_wrap_available"));
    }

    [Test]
    public async Task ToggleActive_FlipsState()
    {
        var created = await _fields.AddAsync(Request());
        Assert.That(created.Data!.Active, Is.True);

        var toggled = await _fields.ToggleActiveAsync(created.Data.Id);

        Assert.That(toggled.Data!.Active, Is.False);
    }

    [Test]
    public async Task GetForEntity_ExcludesInactiveByDefault()
    {
        var created = await _fields.AddAsync(Request());
        await _fields.ToggleActiveAsync(created.Data!.Id);

        var activeOnly = await _fields.GetForEntityAsync("product", includeInactive: false);
        var all = await _fields.GetForEntityAsync("product", includeInactive: true);

        Assert.That(activeOnly, Is.Empty);
        Assert.That(all, Has.Count.EqualTo(1));
    }
}
