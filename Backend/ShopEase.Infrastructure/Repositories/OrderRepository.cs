using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Orders.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly ShopEaseDbContext _db;

    public OrderRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<Order>> GetAllAsync() =>
        _db.Orders.Include(o => o.Items).AsNoTracking()
            .OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id).ToListAsync();

    public Task<Order?> GetByIdAsync(int id) =>
        _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);

    public Task<List<Order>> GetByUserIdAsync(int userId) =>
        _db.Orders.Include(o => o.Items).AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt).ThenByDescending(o => o.Id).ToListAsync();

    public async Task<Order> AddAsync(Order order)
    {
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        return order;
    }

    public async Task UpdateAsync(Order order)
    {
        _db.Orders.Update(order);
        await _db.SaveChangesAsync();
    }

    public Task<List<string>> GetOrderStatusNamesAsync() =>
        _db.OrderStatuses.AsNoTracking().OrderBy(s => s.Id).Select(s => s.Name).ToListAsync();
}
