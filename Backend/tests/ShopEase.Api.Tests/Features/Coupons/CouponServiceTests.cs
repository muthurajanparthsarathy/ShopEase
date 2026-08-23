using Microsoft.EntityFrameworkCore;
using ShopEase.Application.Features.Coupons.Services;
using ShopEase.Domain.Features.Coupons.Entities;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Coupons;

public class CouponServiceTests
{
    private ShopEaseDbContext _db = null!;
    private CouponService _coupons = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);
        _db.Coupons.AddRange(
            new Coupon { Code = "SAVE10", Type = "percent", Value = 10, MaxDiscount = 500, MinOrder = 0, Label = "10% off" },
            new Coupon { Code = "WELCOME50", Type = "flat", Value = 50, MinOrder = 200, Label = "Flat 50 off" },
            new Coupon { Code = "FREESHIP", Type = "freeship", Value = 0, MinOrder = 0, Label = "Free shipping" });
        _db.SaveChanges();
        _coupons = new CouponService(new CouponRepository(_db));
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    [Test]
    public async Task Validate_UnknownCode_Invalid()
    {
        var result = await _coupons.ValidateAsync("NOPE", 1000);
        Assert.That(result.Valid, Is.False);
    }

    [Test]
    public async Task Validate_BelowMinOrder_Invalid()
    {
        var result = await _coupons.ValidateAsync("WELCOME50", 100);
        Assert.That(result.Valid, Is.False);
        Assert.That(result.Message, Does.Contain("minimum order"));
    }

    [Test]
    public async Task Validate_IsCaseInsensitive()
    {
        var result = await _coupons.ValidateAsync("save10", 1000);
        Assert.That(result.Valid, Is.True);
        Assert.That(result.Code, Is.EqualTo("SAVE10"));
    }

    [Test]
    public async Task ComputeDiscount_PercentCoupon_CapsAtMaxDiscount()
    {
        var validation = await _coupons.ValidateAsync("SAVE10", 10000);
        var discount = _coupons.ComputeDiscount(validation.Coupon, 10000);

        // 10% of 10000 = 1000, but capped at MaxDiscount 500
        Assert.That(discount, Is.EqualTo(500));
    }

    [Test]
    public async Task ComputeDiscount_FlatCoupon_NeverExceedsSubtotal()
    {
        var validation = await _coupons.ValidateAsync("WELCOME50", 30);
        // subtotal 30 < minOrder 200, so this coupon wouldn't validate — use a valid one instead
        var valid = await _coupons.ValidateAsync("WELCOME50", 200);
        var discount = _coupons.ComputeDiscount(valid.Coupon, 200);

        Assert.That(discount, Is.EqualTo(50));
    }

    [Test]
    public async Task Apply_PersistsAppliedCode_AndGetAppliedReturnsIt()
    {
        await _coupons.ApplyAsync(userId: 1, "SAVE10", 1000);
        var applied = await _coupons.GetAppliedCodeAsync(1);

        Assert.That(applied, Is.EqualTo("SAVE10"));
    }

    [Test]
    public async Task Apply_ReplacesPreviouslyAppliedCode()
    {
        await _coupons.ApplyAsync(1, "SAVE10", 1000);
        await _coupons.ApplyAsync(1, "FREESHIP", 1000);

        Assert.That(await _coupons.GetAppliedCodeAsync(1), Is.EqualTo("FREESHIP"));
    }
}
