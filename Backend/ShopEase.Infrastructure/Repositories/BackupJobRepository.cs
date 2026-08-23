using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Backup.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class BackupJobRepository : IBackupJobRepository
{
    private readonly ShopEaseDbContext _db;

    public BackupJobRepository(ShopEaseDbContext db) => _db = db;

    // Sorted in memory, case-insensitively. PostgreSQL clusters initialized with LC_COLLATE=C
    // sort all uppercase before all lowercase ("Zebra" before "apple"), which would drop every
    // lowercase-initial job to the bottom of the admin list with no error. SQL Server's CI
    // collation did not behave that way, so this keeps the list looking the same.
    public async Task<List<BackupJob>> GetAllAsync()
    {
        var jobs = await _db.BackupJobs.AsNoTracking().ToListAsync();
        return jobs.OrderBy(j => j.Name, StringComparer.OrdinalIgnoreCase).ToList();
    }

    public Task<BackupJob?> GetByIdAsync(int id) => _db.BackupJobs.AsNoTracking().FirstOrDefaultAsync(j => j.Id == id);

    public Task<List<BackupJob>> GetActiveScheduledAsync() =>
        // Case-tolerant: the guard was doing nothing the moment Schedule was stored as "manual".
        _db.BackupJobs.AsNoTracking().Where(j => j.Active && j.Schedule.ToLower() != "manual").ToListAsync();

    public async Task<BackupJob> AddAsync(BackupJob job)
    {
        _db.BackupJobs.Add(job);
        await _db.SaveChangesAsync();
        return job;
    }

    public async Task UpdateAsync(BackupJob job)
    {
        _db.BackupJobs.Update(job);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var job = await _db.BackupJobs.FindAsync(id);
        if (job == null) return;
        _db.BackupJobs.Remove(job);
        await _db.SaveChangesAsync();
    }
}
