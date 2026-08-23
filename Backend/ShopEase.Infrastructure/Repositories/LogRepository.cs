using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Backup.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class LogRepository : ILogRepository
{
    private readonly ShopEaseDbContext _db;

    public LogRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<LogEntry>> GetRecentAsync(int limit = 100) =>
        _db.Logs.AsNoTracking().OrderByDescending(l => l.Timestamp).ThenByDescending(l => l.Id).Take(limit).ToListAsync();

    public async Task AddAsync(string message)
    {
        _db.Logs.Add(new LogEntry { Message = message, Timestamp = DateTime.UtcNow });
        await _db.SaveChangesAsync();
    }
}
