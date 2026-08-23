namespace ShopEase.Application.Options;

public class BackgroundJobOptions
{
    public const string SectionName = "BackgroundJobs";

    /// <summary>How often the backup scheduler wakes up to check for due jobs.</summary>
    public int BackupPollIntervalSeconds { get; set; } = 60;
}
