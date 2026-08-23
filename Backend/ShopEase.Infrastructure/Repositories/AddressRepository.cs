using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Auth.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

public class AddressRepository : IAddressRepository
{
    private readonly ShopEaseDbContext _db;

    public AddressRepository(ShopEaseDbContext db) => _db = db;

    public Task<List<Address>> GetForUserAsync(int userId) =>
        _db.Addresses.AsNoTracking().Where(a => a.UserId == userId).ToListAsync();

    public Task<Address?> GetByIdAsync(int id) => _db.Addresses.FirstOrDefaultAsync(a => a.Id == id);

    public async Task<Address> AddAsync(Address address)
    {
        _db.Addresses.Add(address);
        await _db.SaveChangesAsync();
        return address;
    }

    public async Task UpdateAsync(Address address)
    {
        _db.Addresses.Update(address);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var address = await _db.Addresses.FindAsync(id);
        if (address == null) return;
        _db.Addresses.Remove(address);
        await _db.SaveChangesAsync();
    }

    public async Task ClearDefaultForUserAsync(int userId)
    {
        var defaults = await _db.Addresses.Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
        foreach (var a in defaults) a.IsDefault = false;
        await _db.SaveChangesAsync();
    }
}
