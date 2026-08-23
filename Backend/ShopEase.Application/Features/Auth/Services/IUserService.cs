using ShopEase.Application.Common;
using ShopEase.Application.Features.Auth.Dtos;

namespace ShopEase.Application.Features.Auth.Services;

public interface IUserService
{
    Task<List<UserDto>> GetAllAsync();
    Task<UserDto?> GetByIdAsync(int id);
    Task<Result> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    Task<Result> ToggleActiveAsync(int userId);
}
