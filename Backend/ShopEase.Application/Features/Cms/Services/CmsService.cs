using System.Text.Json;
using ShopEase.Application.Features.Cms.Dtos;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Cms.Services;

public class CmsService : ICmsService
{
    private const string DefaultHeroJson = """
        {"enabled":true,"greeting":true,"title":"Welcome back","subtitle":"Discover great products at great prices. Fresh arrivals every week.","ctaText":"Start Shopping","ctaLink":"/catalog"}
        """;

    private const string DefaultSectionsJson = """
        [
          {"id":"sec-categories","type":"categories","title":"Shop by Category","enabled":true},
          {"id":"sec-featured","type":"products","title":"Featured Products","enabled":true,"source":"featured","categoryId":"","productIds":[],"limit":8},
          {"id":"sec-new","type":"products","title":"New Arrivals","enabled":true,"source":"newest","categoryId":"","productIds":[],"limit":8},
          {"id":"sec-recent","type":"recentOrders","title":"Your Recent Orders","enabled":true}
        ]
        """;

    private readonly ICmsRepository _cms;

    public CmsService(ICmsRepository cms) => _cms = cms;

    public async Task<CmsConfigDto> GetPublishedAsync()
    {
        var config = await _cms.GetPublishedAsync();
        return config == null ? Defaults() : ToDto(config.HeroJson, config.SectionsJson);
    }

    public Task SavePublishedAsync(CmsConfigDto config) =>
        _cms.SavePublishedAsync(config.Hero.GetRawText(), config.Sections.GetRawText());

    public async Task<CmsConfigDto> GetPreviewAsync()
    {
        var config = await _cms.GetPreviewAsync();
        return config == null ? Defaults() : ToDto(config.HeroJson, config.SectionsJson);
    }

    public Task SavePreviewAsync(CmsConfigDto config) =>
        _cms.SavePreviewAsync(config.Hero.GetRawText(), config.Sections.GetRawText());

    public Task ResetAsync() => _cms.ResetPublishedAsync();

    public CmsConfigDto Defaults() => ToDto(DefaultHeroJson, DefaultSectionsJson);

    private static CmsConfigDto ToDto(string heroJson, string sectionsJson) => new()
    {
        Hero = JsonDocument.Parse(heroJson).RootElement,
        Sections = JsonDocument.Parse(sectionsJson).RootElement,
    };
}
