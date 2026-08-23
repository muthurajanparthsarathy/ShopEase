using ShopEase.Domain.Features.Orders.Entities;

namespace ShopEase.Domain.Repositories;

public interface IOrderRepository
{
    Task<List<Order>> GetAllAsync();
    Task<Order?> GetByIdAsync(int id);
    Task<List<Order>> GetByUserIdAsync(int userId);
    Task<Order> AddAsync(Order order);
    Task UpdateAsync(Order order);
    Task<List<string>> GetOrderStatusNamesAsync();
}
