namespace ShopEase.Application.Options;

public class CacheOptions
{
    public const string SectionName = "Cache";

    public int CatalogTtlMinutes { get; set; } = 5;
    public int LookupTtlMinutes { get; set; } = 30;
}
