namespace ShopEase.Domain.Features.Coupons.Entities;

/// <summary>Which coupon code (if any) a user currently has applied to their cart — coupon *definitions* live in Coupon.</summary>
public class AppliedCoupon
{
    public int UserId { get; set; }
    public string Code { get; set; } = string.Empty;
}
