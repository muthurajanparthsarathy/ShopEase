using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopEase.Domain.Features.Auth.Entities;

namespace ShopEase.Infrastructure.Data.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        // Ids are fixed to match Domain.Enums.RoleId (1=Admin, 2=Customer), not DB-generated.
        builder.Property(r => r.Id).ValueGeneratedNever();
    }
}
