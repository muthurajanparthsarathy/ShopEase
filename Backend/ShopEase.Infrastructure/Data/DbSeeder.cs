using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Enums;
using ShopEase.Domain.Features.Auth.Entities;
using ShopEase.Domain.Features.Coupons.Entities;
using ShopEase.Domain.Features.Orders.Entities;
using ShopEase.Domain.Features.Payments.Entities;

namespace ShopEase.Infrastructure.Data;

/// <summary>
/// Seeds foundational lookup/reference data (roles, payment methods, order/payment statuses, coupon
/// definitions) that other tables reference. Demo users/products/orders live in DemoDataSeeder,
/// mirroring the original app's seed-data.service.ts.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedLookupsAsync(ShopEaseDbContext db)
    {
        if (!await db.Roles.AnyAsync())
        {
            db.Roles.AddRange(
                new Role { Id = (int)RoleId.Admin, Name = "Admin" },
                new Role { Id = (int)RoleId.Customer, Name = "Customer" });
        }

        if (!await db.PaymentMethods.AnyAsync())
        {
            db.PaymentMethods.AddRange(
                new PaymentMethod { Name = "Credit Card" },
                new PaymentMethod { Name = "UPI" },
                new PaymentMethod { Name = "Cash on Delivery" });
        }

        if (!await db.OrderStatuses.AnyAsync())
        {
            db.OrderStatuses.AddRange(
                new OrderStatusLookup { Name = "Pending" },
                new OrderStatusLookup { Name = "Processing" },
                new OrderStatusLookup { Name = "Shipped" },
                new OrderStatusLookup { Name = "Delivered" },
                new OrderStatusLookup { Name = "Cancelled" },
                new OrderStatusLookup { Name = "Returned" });
        }

        if (!await db.PaymentStatuses.AnyAsync())
        {
            db.PaymentStatuses.AddRange(
                new PaymentStatusLookup { Name = "Pending" },
                new PaymentStatusLookup { Name = "Completed" },
                new PaymentStatusLookup { Name = "Failed" },
                new PaymentStatusLookup { Name = "Refunded" });
        }

        // Coupon *definitions* — the original app hardcoded these in coupon.service.ts; this backend
        // moved them into the DB (see B3), so they need seeding here for the feature to work at all.
        if (!await db.Coupons.AnyAsync())
        {
            db.Coupons.AddRange(
                new Coupon { Code = "SAVE10", Type = "percent", Value = 10, MaxDiscount = 500, MinOrder = 0, Label = "10% off your order (up to ₹500)" },
                new Coupon { Code = "WELCOME50", Type = "flat", Value = 50, MinOrder = 200, Label = "₹50 off orders above ₹200" },
                new Coupon { Code = "FLAT100", Type = "flat", Value = 100, MinOrder = 500, Label = "₹100 off orders above ₹500" },
                new Coupon { Code = "FREESHIP", Type = "freeship", Value = 0, MinOrder = 0, Label = "Free shipping on your order" });
        }

        await db.SaveChangesAsync();
    }
}
