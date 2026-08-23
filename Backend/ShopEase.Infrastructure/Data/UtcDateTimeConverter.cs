using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace ShopEase.Infrastructure.Data;

/// <summary>
/// Forces every DateTime crossing the provider boundary to be UTC.
///
/// Npgsql maps CLR <see cref="DateTime"/> to <c>timestamp with time zone</c> and throws on
/// <see cref="DateTimeKind.Unspecified"/> or <see cref="DateTimeKind.Local"/>. EF + SQL Server was
/// Kind-blind, so values that round-tripped fine for years now fail at write time.
///
/// Applied model-wide from <see cref="ShopEaseDbContext.ConfigureConventions"/>, this covers all 17
/// DateTime/DateTime? properties across 13 entities in one place — including the JSON restore path
/// in BackupDataExporter, where deserialized values arrive as Unspecified and there is no
/// constructor to fix.
///
/// Read side re-stamps UTC because Npgsql returns Utc already; the SpecifyKind is belt-and-braces
/// for providers that do not.
/// </summary>
public sealed class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
{
    public UtcDateTimeConverter() : base(
        v => v.Kind == DateTimeKind.Utc ? v
           : v.Kind == DateTimeKind.Local ? v.ToUniversalTime()
           : DateTime.SpecifyKind(v, DateTimeKind.Utc),
        v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
    {
    }
}
