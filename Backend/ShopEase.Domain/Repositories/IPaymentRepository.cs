using ShopEase.Domain.Features.Payments.Entities;

namespace ShopEase.Domain.Repositories;

public interface IPaymentRepository
{
    Task<List<Payment>> GetAllAsync();
    Task<List<Payment>> GetByUserIdAsync(int userId);
    Task<Payment?> GetByOrderIdAsync(int orderId);
    Task<Payment> AddAsync(Payment payment);
    Task<List<PaymentMethod>> GetMethodsAsync();
    Task<List<string>> GetStatusNamesAsync();
}
