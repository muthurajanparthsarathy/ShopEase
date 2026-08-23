using ShopEase.Domain.Features.Coupons.Entities;

namespace ShopEase.Domain.Repositories;

public interface ICouponRepository
{
    Task<List<Coupon>> GetAllAsync();
    Task<Coupon?> GetByCodeAsync(string code);
    Task<AppliedCoupon?> GetAppliedAsync(int userId);
    Task SetAppliedAsync(int userId, string code);
    Task RemoveAppliedAsync(int userId);
}
