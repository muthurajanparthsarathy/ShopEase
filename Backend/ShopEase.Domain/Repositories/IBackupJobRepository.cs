using ShopEase.Domain.Features.Backup.Entities;

namespace ShopEase.Domain.Repositories;

public interface IBackupJobRepository
{
    Task<List<BackupJob>> GetAllAsync();
    Task<BackupJob?> GetByIdAsync(int id);
    Task<List<BackupJob>> GetActiveScheduledAsync();
    Task<BackupJob> AddAsync(BackupJob job);
    Task UpdateAsync(BackupJob job);
    Task DeleteAsync(int id);
}
