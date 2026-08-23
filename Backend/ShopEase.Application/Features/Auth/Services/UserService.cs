using ShopEase.Application.Common;
using ShopEase.Application.Features.Auth.Dtos;
using ShopEase.Domain.Features.Auth.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Auth.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _users;
    private readonly ILogRepository _logs;

    public UserService(IUserRepository users, ILogRepository logs)
    {
        _users = users;
        _logs = logs;
    }

    public async Task<List<UserDto>> GetAllAsync() => (await _users.GetAllAsync()).Select(ToDto).ToList();

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _users.GetByIdAsync(id);
        return user == null ? null : ToDto(user);
    }

    public async Task<Result> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _users.GetByIdAsync(userId);
        if (user == null) return Result.Fail("User not found.");

        user.Name = request.Name;
        user.Phone = request.Phone;
        await _users.UpdateAsync(user);

        return Result.Ok("Profile updated successfully.");
    }

    public async Task<Result> ToggleActiveAsync(int userId)
    {
        var user = await _users.GetByIdAsync(userId);
        if (user == null) return Result.Fail("User not found.");

        user.IsActive = !user.IsActive;
        await _users.UpdateAsync(user);

        var statusLabel = user.IsActive ? "activated" : "deactivated";
        await _logs.AddAsync($"Admin {statusLabel} user: {user.Email}");

        return Result.Ok($"User {statusLabel} successfully.");
    }

    private static UserDto ToDto(User u) => new()
    {
        Id = u.Id, Name = u.Name, Email = u.Email, Phone = u.Phone, RoleId = (int)u.RoleId, IsActive = u.IsActive, CreatedAt = u.CreatedAt,
        Addresses = u.Addresses.Select(a => new AddressDto
        {
            Id = a.Id, Label = a.Label, Line = a.Line, City = a.City, State = a.State, PostalCode = a.PostalCode, IsDefault = a.IsDefault,
        }).ToList(),
    };
}
