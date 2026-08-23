using ShopEase.Domain.Features.Audit.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly ShopEaseDbContext _db;

    public AuditLogRepository(ShopEaseDbContext db) => _db = db;

    public async Task AddAsync(AuditLog log)
    {
        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }
}
