using System.ComponentModel.DataAnnotations;

namespace ShopEase.Application.Features.Coupons.Dtos;

public class CouponDto
{
    public string Code { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal? MaxDiscount { get; set; }
    public decimal MinOrder { get; set; }
    public string Label { get; set; } = string.Empty;
}

public class ApplyCouponRequest
{
    [Required]
    public string Code { get; set; } = string.Empty;
}

public class CouponValidationResultDto
{
    public bool Valid { get; set; }
    public string? Message { get; set; }
    public CouponDto? Coupon { get; set; }
    public string? Code { get; set; }
}
