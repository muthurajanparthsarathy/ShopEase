using ShopEase.Application.Common;
using ShopEase.Application.Features.Orders.Dtos;

namespace ShopEase.Application.Features.Orders.Services;

public interface IOrderService
{
    Task<List<OrderDto>> GetAllAsync();
    Task<OrderDto?> GetByIdAsync(int id);
    Task<List<OrderDto>> GetByUserIdAsync(int userId);
    Task<Result<OrderDto>> PlaceOrderAsync(int userId, int addressId, int paymentMethodId);
    Task<Result> UpdateStatusAsync(int orderId, string newStatus);
    Task<Result> CancelAsync(int orderId, int userId);
    Task<Result> ReturnAsync(int orderId, int userId);
    Task<Result> SetCustomFieldsAsync(int orderId, Dictionary<string, object> custom);
    List<OrderDto> ApplyFilters(List<OrderDto> orders, OrderFiltersQuery filters);
    Task<List<string>> GetOrderStatusesAsync();
}
