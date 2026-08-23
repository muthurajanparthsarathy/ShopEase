using ShopEase.Application.Features.Notifications.Dtos;
using ShopEase.Domain.Features.Notifications.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Notifications.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notifications;

    public NotificationService(INotificationRepository notifications) => _notifications = notifications;

    public async Task<List<NotificationDto>> GetAllAsync(int userId) =>
        (await _notifications.GetForUserAsync(userId)).Select(ToDto).ToList();

    public async Task<int> GetUnreadCountAsync(int userId) =>
        (await _notifications.GetForUserAsync(userId)).Count(n => !n.IsRead);

    public Task MarkAsReadAsync(int notificationId) => _notifications.MarkAsReadAsync(notificationId);

    public Task MarkAllAsReadAsync(int userId) => _notifications.MarkAllAsReadAsync(userId);

    public async Task NotifyOrderPlacedAsync(int userId, string orderNumber)
    {
        // Sequential, not Task.WhenAll: both calls share one scoped DbContext, which EF Core does not
        // support running concurrently.
        await Add(userId, "Order Placed", $"Your order {orderNumber} has been placed successfully!", "success", "email");
        await Add(userId, "Order Confirmation", $"Order {orderNumber} confirmed. We'll update you on shipping.", "info", "sms");
    }

    public Task NotifyOrderStatusChangedAsync(int userId, string orderNumber, string newStatus) => Add(
        userId, $"Order {newStatus}", $"Your order {orderNumber} is now {newStatus}.",
        newStatus == "Cancelled" ? "warning" : "info", "email");

    public Task NotifyPaymentCompletedAsync(int userId, decimal amount, string method) => Add(
        userId, "Payment Successful", $"Payment of ₹{amount:N2} via {method} completed.", "success", "email");

    public Task NotifyPaymentFailedAsync(int userId, decimal amount, string method) => Add(
        userId, "Payment Failed", $"Payment of ₹{amount:N2} via {method} failed. Please retry.", "error", "sms");

    private Task Add(int userId, string title, string message, string type, string channel) =>
        _notifications.AddAsync(new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            Channel = channel,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
        });

    private static NotificationDto ToDto(Notification n) => new()
    {
        Id = n.Id,
        UserId = n.UserId,
        Title = n.Title,
        Message = n.Message,
        Type = n.Type,
        Channel = n.Channel,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt,
    };
}
