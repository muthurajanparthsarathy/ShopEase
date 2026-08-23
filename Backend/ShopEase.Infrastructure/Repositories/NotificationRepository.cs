using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Notifications.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ShopEaseDbContext _db;

    public NotificationRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<Notification>> GetForUserAsync(int userId) =>
        _db.Notifications.AsNoTracking().Where(n => n.UserId == userId).OrderByDescending(n => n.CreatedAt).ToListAsync();

    public async Task<Notification> AddAsync(Notification notification)
    {
        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();
        return notification;
    }

    public async Task MarkAsReadAsync(int id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n == null) return;
        n.IsRead = true;
        await _db.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var unread = await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        foreach (var n in unread) n.IsRead = true;
        await _db.SaveChangesAsync();
    }
}
