using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Backup.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class BackupSnapshotRepository : IBackupSnapshotRepository
{
    private readonly ShopEaseDbContext _db;

    public BackupSnapshotRepository(ShopEaseDbContext db) => _db = db;

    public async Task<BackupSnapshot> AddAsync(BackupSnapshot snapshot)
    {
        _db.BackupSnapshots.Add(snapshot);
        await _db.SaveChangesAsync();
        return snapshot;
    }

    public Task<BackupSnapshot?> GetStagingAsync() =>
        _db.BackupSnapshots.AsNoTracking().Where(s => s.IsStaging).OrderByDescending(s => s.CreatedAt).ThenByDescending(s => s.Id).FirstOrDefaultAsync();

    public async Task SetStagingAsync(BackupSnapshot snapshot)
    {
        await ClearStagingAsync();
        snapshot.IsStaging = true;
        _db.BackupSnapshots.Add(snapshot);
        await _db.SaveChangesAsync();
    }

    public async Task ClearStagingAsync()
    {
        var existing = await _db.BackupSnapshots.Where(s => s.IsStaging).ToListAsync();
        if (existing.Count == 0) return;
        _db.BackupSnapshots.RemoveRange(existing);
        await _db.SaveChangesAsync();
    }

    public async Task TrimAsync(string jobName, int keep)
    {
        // Snapshots are matched to jobs by a denormalized name. A case-only rename used to keep
        // matching under SQL Server's CI collation; on PostgreSQL it would orphan every earlier
        // snapshot, TrimAsync would see fewer than `keep` and return early, and the table would
        // grow without bound — each row carrying a full serialized export blob.
        var normalizedJob = jobName.Trim().ToLowerInvariant();

        var snapshots = await _db.BackupSnapshots
            .Where(s => s.JobName.ToLower() == normalizedJob && !s.IsStaging)
            // Tie-break is load-bearing: the caller does RemoveRange(Skip(keep)), so an ordering
            // flip on equal CreatedAt values deletes the wrong backup.
            .OrderByDescending(s => s.CreatedAt)
            .ThenByDescending(s => s.Id)
            .ToListAsync();

        if (snapshots.Count <= keep) return;
        _db.BackupSnapshots.RemoveRange(snapshots.Skip(keep));
        await _db.SaveChangesAsync();
    }
}
