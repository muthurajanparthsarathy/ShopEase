using ShopEase.Domain.Features.Audit.Entities;

namespace ShopEase.Domain.Repositories;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log);
}
