using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopEase.Domain.Features.Coupons.Entities;

namespace ShopEase.Infrastructure.Data.Configurations;

public class AppliedCouponConfiguration : IEntityTypeConfiguration<AppliedCoupon>
{
    public void Configure(EntityTypeBuilder<AppliedCoupon> builder)
    {
        builder.HasKey(a => a.UserId);
        // UserId is a caller-supplied FK-as-PK, not DB-generated — same fix as RoleConfiguration.
        builder.Property(a => a.UserId).ValueGeneratedNever();
    }
}
