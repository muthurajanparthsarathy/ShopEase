using ShopEase.Application.Features.Notifications.Dtos;

namespace ShopEase.Application.Features.Notifications.Services;

public interface INotificationService
{
    Task<List<NotificationDto>> GetAllAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int notificationId);
    Task MarkAllAsReadAsync(int userId);

    Task NotifyOrderPlacedAsync(int userId, string orderNumber);
    Task NotifyOrderStatusChangedAsync(int userId, string orderNumber, string newStatus);
    Task NotifyPaymentCompletedAsync(int userId, decimal amount, string method);
    Task NotifyPaymentFailedAsync(int userId, decimal amount, string method);
}
