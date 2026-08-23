namespace ShopEase.Domain.Features.Backup.Entities;

/// <summary>
/// A stored export blob — either a completed job's snapshot (IsStaging=false) or a single restore
/// candidate awaiting review (IsStaging=true, at most one live at a time, matching the original app's
/// single "staging" holding area).
/// </summary>
public class BackupSnapshot
{
    public int Id { get; set; }
    public string JobName { get; set; } = string.Empty;
    public string DataJson { get; set; } = "{}";
    public bool IsStaging { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
