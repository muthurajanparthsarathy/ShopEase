namespace ShopEase.Domain.Features.Coupons.Entities;

public class Coupon
{
    /// <summary>Primary key — coupon codes are unique by nature (e.g. SAVE10, WELCOME50).</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>"percent" | "flat" | "freeship".</summary>
    public string Type { get; set; } = string.Empty;

    public decimal Value { get; set; }
    public decimal? MaxDiscount { get; set; }
    public decimal MinOrder { get; set; }
    public string Label { get; set; } = string.Empty;
}
