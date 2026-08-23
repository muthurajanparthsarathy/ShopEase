using ShopEase.Domain.Features.Auth.Entities;

namespace ShopEase.Domain.Repositories;

public interface IAddressRepository
{
    Task<List<Address>> GetForUserAsync(int userId);
    Task<Address?> GetByIdAsync(int id);
    Task<Address> AddAsync(Address address);
    Task UpdateAsync(Address address);
    Task DeleteAsync(int id);
    Task ClearDefaultForUserAsync(int userId);
}
