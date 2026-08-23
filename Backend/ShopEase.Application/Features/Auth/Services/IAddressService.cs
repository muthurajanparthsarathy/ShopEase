using ShopEase.Application.Common;
using ShopEase.Application.Features.Auth.Dtos;

namespace ShopEase.Application.Features.Auth.Services;

public interface IAddressService
{
    Task<List<AddressDto>> GetForUserAsync(int userId);
    Task<Result<AddressDto>> AddAsync(int userId, AddressRequest request);
    Task<Result<AddressDto>> UpdateAsync(int userId, int addressId, AddressRequest request);
    Task<Result> DeleteAsync(int userId, int addressId);
    Task<Result> SetDefaultAsync(int userId, int addressId);
}
