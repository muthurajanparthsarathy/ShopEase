using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopEase.Application.Features.Cms.Dtos;
using ShopEase.Application.Features.Cms.Services;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Cms;

public class CmsServiceTests
{
    private ShopEaseDbContext _db = null!;
    private CmsService _cms = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);
        _cms = new CmsService(new CmsRepository(_db));
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    private static CmsConfigDto SampleConfig(string title) => new()
    {
        Hero = JsonDocument.Parse($$"""{"enabled":true,"greeting":false,"title":"{{title}}","subtitle":"s","ctaText":"Go","ctaLink":"/x"}""").RootElement,
        Sections = JsonDocument.Parse("[]").RootElement,
    };

    [Test]
    public async Task GetPublished_NoConfigSaved_ReturnsDefaults()
    {
        var config = await _cms.GetPublishedAsync();

        Assert.That(config.Hero.GetProperty("title").GetString(), Is.EqualTo("Welcome back"));
    }

    [Test]
    public async Task SaveAndGetPublished_RoundTrips()
    {
        await _cms.SavePublishedAsync(SampleConfig("My Custom Hero"));

        var fetched = await _cms.GetPublishedAsync();
        Assert.That(fetched.Hero.GetProperty("title").GetString(), Is.EqualTo("My Custom Hero"));
    }

    [Test]
    public async Task PreviewAndPublished_AreIndependent()
    {
        await _cms.SavePublishedAsync(SampleConfig("Published Title"));
        await _cms.SavePreviewAsync(SampleConfig("Draft Title"));

        Assert.That((await _cms.GetPublishedAsync()).Hero.GetProperty("title").GetString(), Is.EqualTo("Published Title"));
        Assert.That((await _cms.GetPreviewAsync()).Hero.GetProperty("title").GetString(), Is.EqualTo("Draft Title"));
    }

    [Test]
    public async Task Reset_OnlyClearsPublished_NotPreview()
    {
        await _cms.SavePublishedAsync(SampleConfig("Published Title"));
        await _cms.SavePreviewAsync(SampleConfig("Draft Title"));

        await _cms.ResetAsync();

        Assert.That((await _cms.GetPublishedAsync()).Hero.GetProperty("title").GetString(), Is.EqualTo("Welcome back"));
        Assert.That((await _cms.GetPreviewAsync()).Hero.GetProperty("title").GetString(), Is.EqualTo("Draft Title"));
    }
}
