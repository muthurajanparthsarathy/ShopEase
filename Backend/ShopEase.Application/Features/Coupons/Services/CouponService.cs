using ShopEase.Application.Features.Coupons.Dtos;
using ShopEase.Domain.Features.Coupons.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Coupons.Services;

public class CouponService : ICouponService
{
    private readonly ICouponRepository _coupons;

    public CouponService(ICouponRepository coupons) => _coupons = coupons;

    public async Task<List<CouponDto>> ListAsync() => (await _coupons.GetAllAsync()).Select(ToDto).ToList();

    public async Task<CouponValidationResultDto> ValidateAsync(string code, decimal subtotal)
    {
        var coupon = await _coupons.GetByCodeAsync((code ?? string.Empty).Trim());
        if (coupon == null) return new CouponValidationResultDto { Valid = false, Message = "Invalid coupon code." };
        if (subtotal < coupon.MinOrder)
            return new CouponValidationResultDto { Valid = false, Message = $"Requires a minimum order of ₹{coupon.MinOrder}." };

        return new CouponValidationResultDto { Valid = true, Coupon = ToDto(coupon), Code = coupon.Code };
    }

    public decimal ComputeDiscount(CouponDto? coupon, decimal subtotal)
    {
        if (coupon == null) return 0;
        if (coupon.Type == "percent")
        {
            var d = subtotal * (coupon.Value / 100);
            return Math.Round(Math.Min(d, coupon.MaxDiscount ?? d), 2);
        }
        if (coupon.Type == "flat") return Math.Min(coupon.Value, subtotal);
        return 0; // freeship affects shipping directly, not the discount amount
    }

    public async Task<string?> GetAppliedCodeAsync(int userId) => (await _coupons.GetAppliedAsync(userId))?.Code;

    public async Task<CouponValidationResultDto> ApplyAsync(int userId, string code, decimal subtotal)
    {
        var validation = await ValidateAsync(code, subtotal);
        if (!validation.Valid) return validation;

        await _coupons.SetAppliedAsync(userId, validation.Code!);
        return new CouponValidationResultDto { Valid = true, Message = $"Coupon \"{validation.Code}\" applied!", Code = validation.Code };
    }

    public Task RemoveAppliedAsync(int userId) => _coupons.RemoveAppliedAsync(userId);

    private static CouponDto ToDto(Coupon c) => new()
    {
        Code = c.Code,
        Type = c.Type,
        Value = c.Value,
        MaxDiscount = c.MaxDiscount,
        MinOrder = c.MinOrder,
        Label = c.Label,
    };
}
