using ShopEase.Application.Common;
using ShopEase.Application.Features.Auth.Dtos;
using ShopEase.Domain.Features.Auth.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Auth.Services;

public class AddressService : IAddressService
{
    private readonly IAddressRepository _addresses;

    public AddressService(IAddressRepository addresses) => _addresses = addresses;

    public async Task<List<AddressDto>> GetForUserAsync(int userId) =>
        (await _addresses.GetForUserAsync(userId)).Select(ToDto).ToList();

    public async Task<Result<AddressDto>> AddAsync(int userId, AddressRequest request)
    {
        var existing = await _addresses.GetForUserAsync(userId);

        var address = new Address
        {
            UserId = userId,
            Label = request.Label,
            Line = request.Line,
            City = request.City,
            State = request.State,
            PostalCode = request.PostalCode,
            IsDefault = existing.Count == 0, // the very first address is automatically the default
        };

        await _addresses.AddAsync(address);
        return Result<AddressDto>.Ok(ToDto(address), "Address added successfully.");
    }

    public async Task<Result<AddressDto>> UpdateAsync(int userId, int addressId, AddressRequest request)
    {
        var address = await _addresses.GetByIdAsync(addressId);
        if (address == null || address.UserId != userId) return Result<AddressDto>.Fail("Address not found.");

        address.Label = request.Label;
        address.Line = request.Line;
        address.City = request.City;
        address.State = request.State;
        address.PostalCode = request.PostalCode;

        await _addresses.UpdateAsync(address);
        return Result<AddressDto>.Ok(ToDto(address), "Address updated successfully.");
    }

    public async Task<Result> DeleteAsync(int userId, int addressId)
    {
        var address = await _addresses.GetByIdAsync(addressId);
        if (address == null || address.UserId != userId) return Result.Fail("Address not found.");

        await _addresses.DeleteAsync(addressId);
        return Result.Ok("Address deleted successfully.");
    }

    public async Task<Result> SetDefaultAsync(int userId, int addressId)
    {
        var address = await _addresses.GetByIdAsync(addressId);
        if (address == null || address.UserId != userId) return Result.Fail("Address not found.");

        await _addresses.ClearDefaultForUserAsync(userId);
        address.IsDefault = true;
        await _addresses.UpdateAsync(address);

        return Result.Ok("Default address updated.");
    }

    private static AddressDto ToDto(Address a) => new()
    {
        Id = a.Id,
        Label = a.Label,
        Line = a.Line,
        City = a.City,
        State = a.State,
        PostalCode = a.PostalCode,
        IsDefault = a.IsDefault,
    };
}
