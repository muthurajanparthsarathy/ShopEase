namespace ShopEase.Domain.Features.Backup.Entities;

public class BackupJob
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Serialized list of entity names this job exports, e.g. ["Products","Orders"].</summary>
    public string SourceJson { get; set; } = "[]";

    /// <summary>"Full" | "Incremental" | "Differential".</summary>
    public string Type { get; set; } = "Full";

    /// <summary>"Manual" | "Hourly" | "Daily" | "Weekly" | "Monthly" — drives BackupJobBackgroundService.</summary>
    public string Schedule { get; set; } = "Manual";

    public int Retention { get; set; } = 10;
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastRunAt { get; set; }
}
