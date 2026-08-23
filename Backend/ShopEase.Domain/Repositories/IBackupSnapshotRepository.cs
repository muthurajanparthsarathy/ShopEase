using ShopEase.Domain.Features.Backup.Entities;

namespace ShopEase.Domain.Repositories;

public interface IBackupSnapshotRepository
{
    Task<BackupSnapshot> AddAsync(BackupSnapshot snapshot);
    Task<BackupSnapshot?> GetStagingAsync();
    Task SetStagingAsync(BackupSnapshot snapshot);
    Task ClearStagingAsync();
    Task TrimAsync(string jobName, int keep);
}
