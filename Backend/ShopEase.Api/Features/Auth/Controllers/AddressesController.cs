using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Auth.Dtos;
using ShopEase.Application.Features.Auth.Services;

namespace ShopEase.Api.Features.Auth.Controllers;

[Authorize]
[ApiController]
[Route("api/users/me/addresses")]
public class AddressesController : ControllerBase
{
    private readonly IAddressService _addresses;

    public AddressesController(IAddressService addresses) => _addresses = addresses;

    [HttpGet]
    public async Task<ActionResult<List<AddressDto>>> GetAll() => Ok(await _addresses.GetForUserAsync(UserId()));

    [HttpPost]
    public async Task<ActionResult<AddressDto>> Add(AddressRequest request)
    {
        var result = await _addresses.AddAsync(UserId(), request);
        return Ok(result.Data);
    }

    [HttpPut("{addressId:int}")]
    public async Task<ActionResult<AddressDto>> Update(int addressId, AddressRequest request)
    {
        var result = await _addresses.UpdateAsync(UserId(), addressId, request);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return Ok(result.Data);
    }

    [HttpDelete("{addressId:int}")]
    public async Task<IActionResult> Delete(int addressId)
    {
        var result = await _addresses.DeleteAsync(UserId(), addressId);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return NoContent();
    }

    [HttpPatch("{addressId:int}/set-default")]
    public async Task<IActionResult> SetDefault(int addressId)
    {
        var result = await _addresses.SetDefaultAsync(UserId(), addressId);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return NoContent();
    }

    private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
