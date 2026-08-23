namespace ShopEase.Api.Options;

/// <summary>Pure ASP.NET Core middleware config — unlike the other Options classes, nothing outside
/// Program.cs needs to read this, so it stays in the Api project rather than Application.</summary>
public class RateLimitOptions
{
    public const string SectionName = "RateLimit";

    public int AuthPermitLimit { get; set; } = 10;
    public int AuthWindowSeconds { get; set; } = 60;
}
