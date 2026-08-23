namespace ShopEase.Domain.Features.Auth.Entities;

/// <summary>
/// One row per login (device/browser) — doubles as the session table. Revocation is a soft flag
/// (RevokedAt), not a separate denylist. ReplacedByTokenHash chains rotations together so a reused
/// (already-rotated) token can be detected and rejected.
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }

    /// <summary>SHA-256 hash of the opaque refresh token — the raw value is never persisted.</summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>Best-effort device/browser label, taken from the request's User-Agent at login time.</summary>
    public string? DeviceInfo { get; set; }

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTime.UtcNow;
}
