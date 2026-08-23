using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Auth.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ShopEaseDbContext _db;

    public UserRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<User>> GetAllAsync() =>
        _db.Users.Include(u => u.Addresses).AsNoTracking().ToListAsync();

    public Task<User?> GetByIdAsync(int id) =>
        _db.Users.Include(u => u.Addresses).FirstOrDefaultAsync(u => u.Id == id);

    // Emails are stored already-normalized (AuthService lowercases on write), so this compares
    // plainly rather than calling ToLower() on the column. Three reasons that matters:
    //   1. PostgreSQL is case-sensitive, so the old ToLower()==ToLower() was load-bearing here in
    //      a way it never was under SQL Server's case-insensitive collation.
    //   2. lower("Email") is not sargable — every login was a sequential scan over Users, even
    //      though IX_Users_Email exists. Plain equality uses the index.
    //   3. PostgreSQL's lower() is locale-dependent (tr_TR maps 'I' to a dotless i).
    //
    // SingleOrDefault, not FirstOrDefault: with normalize-on-write plus the unique index a
    // duplicate is impossible, so one appearing means the data is corrupt and should throw rather
    // than let the planner silently pick a row — which is how a user ends up in the wrong cart.
    public Task<User?> GetByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return _db.Users.Include(u => u.Addresses).SingleOrDefaultAsync(u => u.Email == normalized);
    }

    public async Task<User> AddAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task UpdateAsync(User user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }
}
