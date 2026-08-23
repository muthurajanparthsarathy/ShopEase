using ShopEase.Application.Features.Coupons.Dtos;

namespace ShopEase.Application.Features.Coupons.Services;

public interface ICouponService
{
    Task<List<CouponDto>> ListAsync();
    Task<CouponValidationResultDto> ValidateAsync(string code, decimal subtotal);
    decimal ComputeDiscount(CouponDto? coupon, decimal subtotal);
    Task<string?> GetAppliedCodeAsync(int userId);
    Task<CouponValidationResultDto> ApplyAsync(int userId, string code, decimal subtotal);
    Task RemoveAppliedAsync(int userId);
}
