using ShopEase.Domain.Features.Backup.Entities;

namespace ShopEase.Domain.Repositories;

public interface ILogRepository
{
    Task<List<LogEntry>> GetRecentAsync(int limit = 100);
    Task AddAsync(string message);
}
