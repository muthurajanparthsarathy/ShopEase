using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopEase.Domain.Features.Cms.Entities;

namespace ShopEase.Infrastructure.Data.Configurations;

public class CmsConfigConfiguration : IEntityTypeConfiguration<CmsConfig>
{
    public void Configure(EntityTypeBuilder<CmsConfig> builder)
    {
        // Fixed Ids (1=published, 2=preview) — not DB-generated. Same fix as RoleConfiguration.
        builder.Property(c => c.Id).ValueGeneratedNever();
    }
}
