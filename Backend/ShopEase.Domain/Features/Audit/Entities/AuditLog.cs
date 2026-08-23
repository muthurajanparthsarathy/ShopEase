namespace ShopEase.Domain.Features.Audit.Entities;

/// <summary>
/// Security/administrative events (login, logout, register, admin CRUD) — distinct from the
/// Backup feature's LogEntry, which stays the simple admin-dashboard "recent activity" feed.
/// </summary>
public class AuditLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Entity { get; set; }
    public string? EntityId { get; set; }
    public string? IpAddress { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
