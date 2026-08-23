using Microsoft.EntityFrameworkCore;
using ShopEase.Application.Features.Catalog.Dtos;
using ShopEase.Application.Features.Catalog.Services;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Catalog;

public class ReviewServiceTests
{
    private ShopEaseDbContext _db = null!;
    private ReviewService _reviews = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);
        _reviews = new ReviewService(new ReviewRepository(_db));
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    [Test]
    public async Task GetStats_AveragesAndCountsCorrectly()
    {
        await _reviews.AddAsync(new ReviewCreateRequest { ProductId = 1, Rating = 5 }, 1, "Alice");
        await _reviews.AddAsync(new ReviewCreateRequest { ProductId = 1, Rating = 3 }, 2, "Bob");

        var stats = await _reviews.GetStatsAsync(1);

        Assert.That(stats.Count, Is.EqualTo(2));
        Assert.That(stats.Avg, Is.EqualTo(4.0));
    }

    [Test]
    public async Task GetStats_NoReviews_ReturnsZero()
    {
        var stats = await _reviews.GetStatsAsync(999);

        Assert.That(stats.Count, Is.EqualTo(0));
        Assert.That(stats.Avg, Is.EqualTo(0));
    }

    [Test]
    public async Task HasReviewed_ReflectsExistingReview()
    {
        await _reviews.AddAsync(new ReviewCreateRequest { ProductId = 1, Rating = 4 }, 1, "Alice");

        Assert.That(await _reviews.HasReviewedAsync(1, 1), Is.True);
        Assert.That(await _reviews.HasReviewedAsync(1, 2), Is.False);
    }

    [Test]
    public async Task GetStatsForAll_GroupsByProduct()
    {
        await _reviews.AddAsync(new ReviewCreateRequest { ProductId = 1, Rating = 5 }, 1, "Alice");
        await _reviews.AddAsync(new ReviewCreateRequest { ProductId = 2, Rating = 2 }, 1, "Alice");

        var stats = await _reviews.GetStatsForAllAsync();

        Assert.That(stats.Keys, Is.EquivalentTo(new[] { 1, 2 }));
        Assert.That(stats[1].Avg, Is.EqualTo(5.0));
        Assert.That(stats[2].Avg, Is.EqualTo(2.0));
    }
}
