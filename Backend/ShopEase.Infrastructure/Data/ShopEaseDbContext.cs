using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Auth.Entities;
using ShopEase.Domain.Features.Audit.Entities;
using ShopEase.Domain.Features.Backup.Entities;
using ShopEase.Domain.Features.Cart.Entities;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Domain.Features.Cms.Entities;
using ShopEase.Domain.Features.Coupons.Entities;
using ShopEase.Domain.Features.CustomFields.Entities;
using ShopEase.Domain.Features.Notifications.Entities;
using ShopEase.Domain.Features.Orders.Entities;
using ShopEase.Domain.Features.Payments.Entities;

namespace ShopEase.Infrastructure.Data;

public class ShopEaseDbContext : DbContext
{
    public ShopEaseDbContext(DbContextOptions<ShopEaseDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<AppliedCoupon> AppliedCoupons => Set<AppliedCoupon>();
    public DbSet<CmsConfig> CmsConfigs => Set<CmsConfig>();
    public DbSet<CustomField> CustomFields => Set<CustomField>();
    public DbSet<LogEntry> Logs => Set<LogEntry>();
    public DbSet<BackupJob> BackupJobs => Set<BackupJob>();
    public DbSet<BackupSnapshot> BackupSnapshots => Set<BackupSnapshot>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<OrderStatusLookup> OrderStatuses => Set<OrderStatusLookup>();
    public DbSet<PaymentStatusLookup> PaymentStatuses => Set<PaymentStatusLookup>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<decimal>().HavePrecision(18, 2);

        // Npgsql throws on a non-UTC DateTime for timestamptz columns; SQL Server did not care.
        // Properties<DateTime>() covers DateTime? as well. Safe here because no DateTime appears
        // inside a translated LINQ predicate — all date filtering is in-memory over List<T>
        // (OrderService, PaymentService). Re-check this if those filters ever move to IQueryable.
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ShopEaseDbContext).Assembly);
    }
}
