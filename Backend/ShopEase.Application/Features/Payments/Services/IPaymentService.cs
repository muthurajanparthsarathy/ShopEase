using ShopEase.Application.Common;
using ShopEase.Application.Features.Payments.Dtos;

namespace ShopEase.Application.Features.Payments.Services;

public interface IPaymentService
{
    Task<List<PaymentDto>> GetAllAsync();
    Task<List<PaymentDto>> GetByUserIdAsync(int userId);
    Task<PaymentDto?> GetByOrderIdAsync(int orderId);
    Task<Result<PaymentDto>> ProcessAsync(int userId, ProcessPaymentRequest request);
    Task<List<PaymentMethodDto>> GetMethodsAsync();
    List<PaymentDto> ApplyFilters(List<PaymentDto> payments, string? method, string? status, DateTime? dateFrom, DateTime? dateTo, decimal? minAmount, decimal? maxAmount);
}
