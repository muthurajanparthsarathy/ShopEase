using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Auth.Dtos;
using ShopEase.Application.Features.Auth.Services;

namespace ShopEase.Api.Features.Auth.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _users;

    public UsersController(IUserService users) => _users = users;

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll() => Ok(await _users.GetAllAsync());

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var user = await _users.GetByIdAsync(UserId());
        return user == null ? NotFound() : Ok(user);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(UpdateProfileRequest request)
    {
        var result = await _users.UpdateProfileAsync(UserId(), request);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return Ok(new { message = result.Message });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetById(int id)
    {
        var user = await _users.GetByIdAsync(id);
        return user == null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:int}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var result = await _users.ToggleActiveAsync(id);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return Ok(new { message = result.Message });
    }

    private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
