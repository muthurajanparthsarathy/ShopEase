using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopEase.Application.Abstractions;
using ShopEase.Application.Common;
using ShopEase.Domain.Features.Backup.Entities;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Features.Coupons.Entities;
using ShopEase.Domain.Features.CustomFields.Entities;
using ShopEase.Domain.Features.Notifications.Entities;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Backup;

/// <summary>
/// Export covers every entity below. Restore is intentionally a smaller subset — Users/Orders/Payments
/// have cross-entity FK chains (Address, OrderItem) a blind upsert could corrupt, so those are
/// export-only. Restore uses upsert-by-key semantics (never delete rows missing from the backup),
/// which is a deliberately conservative "danger zone" design for a portfolio-scale app.
/// </summary>
public class BackupDataExporter : IBackupDataExporter
{
    private readonly ShopEaseDbContext _db;
    private readonly ICacheService _cache;

    public BackupDataExporter(ShopEaseDbContext db, ICacheService cache)
    {
        _db = db;
        _cache = cache;
    }

    /// <summary>Mirrors ProductService/CategoryService's own cache keys — writes made here go straight
    /// through the DbContext, bypassing those services entirely, so their cache never sees the change.</summary>
    private void InvalidateCatalogCache()
    {
        _cache.Remove("products:all");
        _cache.Remove("categories:all");
    }

    public IReadOnlyList<string> AvailableEntities { get; } =
        new[] { "Users", "Products", "Categories", "Orders", "Payments", "Notifications", "Logs", "Reviews", "Coupons", "CustomFields" };

    public IReadOnlyList<string> RestorableEntities { get; } =
        new[] { "Products", "Categories", "CustomFields", "Coupons", "Notifications", "Logs" };

    public async Task<Dictionary<string, object>> ExportAsync(IEnumerable<string> entityNames)
    {
        var result = new Dictionary<string, object>();
        foreach (var name in entityNames.Distinct())
        {
            object? data = name switch
            {
                "Users" => await _db.Users.AsNoTracking().ToListAsync(),
                "Products" => await _db.Products.AsNoTracking().ToListAsync(),
                "Categories" => await _db.Categories.AsNoTracking().ToListAsync(),
                "Orders" => await _db.Orders.AsNoTracking().Include(o => o.Items).ToListAsync(),
                "Payments" => await _db.Payments.AsNoTracking().ToListAsync(),
                "Notifications" => await _db.Notifications.AsNoTracking().ToListAsync(),
                "Logs" => await _db.Logs.AsNoTracking().ToListAsync(),
                "Reviews" => await _db.Reviews.AsNoTracking().ToListAsync(),
                "Coupons" => await _db.Coupons.AsNoTracking().ToListAsync(),
                "CustomFields" => await _db.CustomFields.AsNoTracking().ToListAsync(),
                _ => null,
            };
            if (data != null) result[name] = data;
        }
        return result;
    }

    public Task<int> CountAsync(string entityName) => entityName switch
    {
        "Users" => _db.Users.CountAsync(),
        "Products" => _db.Products.CountAsync(),
        "Categories" => _db.Categories.CountAsync(),
        "Orders" => _db.Orders.CountAsync(),
        "Payments" => _db.Payments.CountAsync(),
        "Notifications" => _db.Notifications.CountAsync(),
        "Logs" => _db.Logs.CountAsync(),
        "Reviews" => _db.Reviews.CountAsync(),
        "Coupons" => _db.Coupons.CountAsync(),
        "CustomFields" => _db.CustomFields.CountAsync(),
        _ => Task.FromResult(0),
    };

    public async Task<Result> RestoreAsync(string entityName, JsonElement data)
    {
        if (!RestorableEntities.Contains(entityName))
            return Result.Fail($"'{entityName}' cannot be restored directly (has cross-entity dependencies) — export-only.");

        if (data.ValueKind != JsonValueKind.Array) return Result.Fail("Expected a JSON array.");

        var (updated, skipped) = entityName switch
        {
            "Products" => await UpdateExistingAsync(data, _db.Products, p => p.Id),
            "Categories" => await UpdateExistingAsync(data, _db.Categories, c => c.Id),
            "CustomFields" => await UpdateExistingAsync(data, _db.CustomFields, f => f.Id),
            "Coupons" => await UpdateExistingCouponsAsync(data),
            "Notifications" => await UpdateExistingAsync(data, _db.Notifications, n => n.Id),
            "Logs" => await UpdateExistingAsync(data, _db.Logs, l => l.Id),
            _ => (0, 0),
        };

        if (entityName is "Products" or "Categories") InvalidateCatalogCache();

        var message = $"{updated} row(s) restored for {entityName}.";
        if (skipped > 0) message += $" {skipped} row(s) skipped (no longer exist — restore only reverts existing rows, it doesn't recreate deleted ones, since their auto-generated ids can't be reused safely).";
        return Result.Ok(message);
    }

    /// <summary>
    /// Only updates rows that still exist — never inserts. Recreating a deleted row with its original
    /// id would require bypassing IDENTITY_INSERT, which is more risk than this "danger zone" feature
    /// is worth; reverting existing rows to prior values is the safe, common restore case anyway.
    /// </summary>
    private async Task<(int Updated, int Skipped)> UpdateExistingAsync<TEntity, TKey>(JsonElement data, DbSet<TEntity> set, Func<TEntity, TKey> keySelector)
        where TEntity : class
    {
        var incoming = JsonSerializer.Deserialize<List<TEntity>>(data.GetRawText(), JsonOpts) ?? new List<TEntity>();
        var existingKeys = (await set.AsNoTracking().ToListAsync()).Select(e => keySelector(e)!.ToString()!).ToHashSet();

        var updated = 0;
        var skipped = 0;
        foreach (var entity in incoming)
        {
            if (existingKeys.Contains(keySelector(entity)!.ToString()!)) { set.Update(entity); updated++; }
            else skipped++;
        }
        await _db.SaveChangesAsync();
        return (updated, skipped);
    }

    private async Task<(int Updated, int Skipped)> UpdateExistingCouponsAsync(JsonElement data)
    {
        var incoming = JsonSerializer.Deserialize<List<Coupon>>(data.GetRawText(), JsonOpts) ?? new List<Coupon>();

        // Code is the primary key, and this JSON is hand-editable — so it is the one path that can
        // introduce a case-variant coupon. Normalize incoming codes to the canonical upper form and
        // compare case-insensitively: otherwise a backup carrying "save10" misses an existing
        // "SAVE10", falls through to Update() against a key that does not exist, and throws.
        var existingCodes = (await _db.Coupons.AsNoTracking().Select(c => c.Code).ToListAsync())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var updated = 0;
        var skipped = 0;
        foreach (var coupon in incoming)
        {
            coupon.Code = coupon.Code.Trim().ToUpperInvariant();
            if (existingCodes.Contains(coupon.Code)) { _db.Coupons.Update(coupon); updated++; }
            else skipped++;
        }
        await _db.SaveChangesAsync();
        return (updated, skipped);
    }

    /// <summary>
    /// Clears every table DemoDataSeeder owns, plus tables that merely reference Users/Products and
    /// would otherwise be left dangling (sessions, cart/wishlist, audit trail) — then reseeds. Coupons,
    /// CustomFields, CmsConfigs, BackupJobs/Snapshots and lookup tables are untouched: they aren't part
    /// of the seeded demo dataset and a "reset to defaults" shouldn't discard admin configuration.
    /// </summary>
    public async Task ResetAllAsync()
    {
        // One transaction around the wipe AND the reseed. Each ExecuteDeleteAsync issues its own
        // statement, which autocommits individually — so a failure partway through used to leave
        // the database half-wiped with an admin staring at an empty catalog and no way back.
        // Either the whole reset lands or none of it does.
        //
        // Routed through the execution strategy because the DbContext is configured with
        // EnableRetryOnFailure: a retrying strategy refuses user-initiated transactions outright
        // ("does not support user-initiated transactions") unless the whole unit is handed to it,
        // since on retry it must replay the entire transaction rather than half of one.
        var strategy = _db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _db.Database.BeginTransactionAsync();

            await _db.RefreshTokens.ExecuteDeleteAsync();
            await _db.AuditLogs.ExecuteDeleteAsync();
            await _db.CartItems.ExecuteDeleteAsync();
            await _db.WishlistItems.ExecuteDeleteAsync();
            await _db.AppliedCoupons.ExecuteDeleteAsync();
            await _db.Reviews.ExecuteDeleteAsync();
            await _db.OrderItems.ExecuteDeleteAsync();
            await _db.Payments.ExecuteDeleteAsync();
            await _db.Notifications.ExecuteDeleteAsync();
            await _db.Orders.ExecuteDeleteAsync();
            await _db.Addresses.ExecuteDeleteAsync();
            await _db.Users.ExecuteDeleteAsync();
            await _db.Products.ExecuteDeleteAsync();
            await _db.Categories.ExecuteDeleteAsync();
            await _db.Logs.ExecuteDeleteAsync();

            await DemoDataSeeder.SeedAsync(_db, force: true);

            await tx.CommitAsync();
        });

        InvalidateCatalogCache();
    }

    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);
}
