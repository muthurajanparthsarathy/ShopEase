using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Cart.Services;

namespace ShopEase.Api.Features.Cart.Controllers;

[Authorize]
[ApiController]
[Route("api/wishlist")]
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlist;

    public WishlistController(IWishlistService wishlist) => _wishlist = wishlist;

    [HttpGet]
    public async Task<ActionResult<List<int>>> GetIds() => Ok(await _wishlist.GetIdsAsync(UserId()));

    [HttpGet("count")]
    public async Task<ActionResult<int>> Count() => Ok(await _wishlist.CountAsync(UserId()));

    [HttpGet("{productId:int}")]
    public async Task<ActionResult<bool>> Has(int productId) => Ok(await _wishlist.HasAsync(UserId(), productId));

    [HttpPost("{productId:int}/toggle")]
    public async Task<ActionResult<bool>> Toggle(int productId) => Ok(await _wishlist.ToggleAsync(UserId(), productId));

    [HttpDelete("{productId:int}")]
    public async Task<IActionResult> Remove(int productId)
    {
        await _wishlist.RemoveAsync(UserId(), productId);
        return NoContent();
    }

    private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
