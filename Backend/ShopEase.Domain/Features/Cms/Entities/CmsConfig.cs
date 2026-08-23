namespace ShopEase.Domain.Features.Cms.Entities;

/// <summary>Singleton-per-flag table: Id=1 is the published config, Id=2 is the admin's live-preview draft.</summary>
public class CmsConfig
{
    public int Id { get; set; }
    public string HeroJson { get; set; } = string.Empty;
    public string SectionsJson { get; set; } = "[]";
}
