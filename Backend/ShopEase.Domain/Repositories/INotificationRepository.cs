using ShopEase.Domain.Features.Notifications.Entities;

namespace ShopEase.Domain.Repositories;

public interface INotificationRepository
{
    Task<List<Notification>> GetForUserAsync(int userId);
    Task<Notification> AddAsync(Notification notification);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync(int userId);
}
