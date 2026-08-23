using Microsoft.EntityFrameworkCore;
using ShopEase.Application.Features.Cart.Services;
using ShopEase.Application.Features.Coupons.Services;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Features.Coupons.Entities;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Cart;

public class CartServiceTests
{
    private ShopEaseDbContext _db = null!;
    private CartService _cart = null!;
    private Product _product = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);

        _product = new Product { Name = "Mouse", Brand = "Logitech", Sku = "SKU-1", Price = 500, Stock = 5, CategoryId = 1 };
        _db.Products.Add(_product);
        _db.SaveChanges();

        var coupons = new CouponService(new CouponRepository(_db));
        _cart = new CartService(new CartRepository(_db), new ProductRepository(_db), coupons);
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    [Test]
    public async Task AddToCart_ExceedingStock_Fails()
    {
        var result = await _cart.AddToCartAsync(userId: 1, _product.Id, quantity: 10);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("more available"));
    }

    [Test]
    public async Task AddToCart_Twice_AccumulatesQuantity()
    {
        await _cart.AddToCartAsync(1, _product.Id, 2);
        await _cart.AddToCartAsync(1, _product.Id, 1);

        var items = await _cart.GetCartAsync(1);
        Assert.That(items.Single().Quantity, Is.EqualTo(3));
    }

    [Test]
    public async Task GetSummary_AppliesShippingThreshold()
    {
        // 1 unit @ 500 -> below the 500 free-shipping *strict* threshold? subtotal==500 counts as free (>=500)
        await _cart.AddToCartAsync(1, _product.Id, 1);
        var summary = await _cart.GetSummaryAsync(1);

        Assert.That(summary.Subtotal, Is.EqualTo(500));
        Assert.That(summary.Shipping, Is.EqualTo(0)); // subtotal >= 500 => free shipping
    }

    [Test]
    public async Task GetSummary_BelowFreeShippingThreshold_Charges50()
    {
        var cheap = new Product { Name = "Cable", Brand = "Generic", Sku = "SKU-2", Price = 100, Stock = 5, CategoryId = 1 };
        _db.Products.Add(cheap);
        await _db.SaveChangesAsync();

        await _cart.AddToCartAsync(1, cheap.Id, 1);
        var summary = await _cart.GetSummaryAsync(1);

        Assert.That(summary.Subtotal, Is.EqualTo(100));
        Assert.That(summary.Shipping, Is.EqualTo(50));
    }

    [Test]
    public async Task SaveForLater_MovesItemOutOfActiveCart()
    {
        await _cart.AddToCartAsync(1, _product.Id, 1);
        await _cart.SaveForLaterAsync(1, _product.Id);

        Assert.That(await _cart.GetCartAsync(1), Is.Empty);
        Assert.That((await _cart.GetSavedAsync(1)).Single().ProductId, Is.EqualTo(_product.Id));
    }

    [Test]
    public async Task MoveToCart_MovesItemBackToActiveCart()
    {
        await _cart.AddToCartAsync(1, _product.Id, 2);
        await _cart.SaveForLaterAsync(1, _product.Id);

        await _cart.MoveToCartAsync(1, _product.Id);

        Assert.That(await _cart.GetSavedAsync(1), Is.Empty);
        Assert.That((await _cart.GetCartAsync(1)).Single().Quantity, Is.EqualTo(2));
    }

    [Test]
    public async Task ClearCart_AlsoRemovesAppliedCoupon()
    {
        _db.Coupons.Add(new Coupon { Code = "SAVE10", Type = "percent", Value = 10, MinOrder = 0, Label = "10% off" });
        await _db.SaveChangesAsync();
        var coupons = new CouponService(new CouponRepository(_db));

        await _cart.AddToCartAsync(1, _product.Id, 1);
        await coupons.ApplyAsync(1, "SAVE10", 500);

        await _cart.ClearCartAsync(1);

        Assert.That(await coupons.GetAppliedCodeAsync(1), Is.Null);
    }
}
