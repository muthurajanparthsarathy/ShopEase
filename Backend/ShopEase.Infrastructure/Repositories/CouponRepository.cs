using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Coupons.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class CouponRepository : ICouponRepository
{
    private readonly ShopEaseDbContext _db;

    public CouponRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<Coupon>> GetAllAsync() => _db.Coupons.AsNoTracking().ToListAsync();

    // Coupon.Code is the PRIMARY KEY. Under SQL Server's CI collation 'save10' and 'SAVE10' were
    // the same key; on PostgreSQL they are two distinct rows, and FirstOrDefault would then hand
    // back whichever the planner reached first — the same code yielding a different discount on
    // different visits. Normalizing to upper on both read and write keeps one canonical row.
    public Task<Coupon?> GetByCodeAsync(string code)
    {
        var normalized = code.Trim().ToUpperInvariant();
        return _db.Coupons.FirstOrDefaultAsync(c => c.Code == normalized);
    }

    public Task<AppliedCoupon?> GetAppliedAsync(int userId) =>
        _db.AppliedCoupons.AsNoTracking().FirstOrDefaultAsync(a => a.UserId == userId);

    public async Task SetAppliedAsync(int userId, string code)
    {
        // Normalized to match Coupon.Code's canonical casing — AppliedCoupon.Code is resolved back
        // through GetByCodeAsync at checkout, so a mixed-case value stored here would miss.
        var normalized = code.Trim().ToUpperInvariant();

        var existing = await _db.AppliedCoupons.FirstOrDefaultAsync(a => a.UserId == userId);
        if (existing == null)
        {
            _db.AppliedCoupons.Add(new AppliedCoupon { UserId = userId, Code = normalized });
        }
        else
        {
            existing.Code = normalized;
        }

        await _db.SaveChangesAsync();
    }

    public async Task RemoveAppliedAsync(int userId)
    {
        var existing = await _db.AppliedCoupons.FirstOrDefaultAsync(a => a.UserId == userId);
        if (existing == null) return;
        _db.AppliedCoupons.Remove(existing);
        await _db.SaveChangesAsync();
    }
}
