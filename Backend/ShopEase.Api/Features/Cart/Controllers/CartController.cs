using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Cart.Dtos;
using ShopEase.Application.Features.Cart.Services;

namespace ShopEase.Api.Features.Cart.Controllers;

[Authorize]
[ApiController]
[Route("api/cart")]
public class CartController : ControllerBase
{
    private readonly ICartService _cart;

    public CartController(ICartService cart) => _cart = cart;

    [HttpGet]
    public async Task<ActionResult<List<CartItemDto>>> GetCart() => Ok(await _cart.GetCartAsync(UserId()));

    [HttpGet("saved")]
    public async Task<ActionResult<List<CartItemDto>>> GetSaved() => Ok(await _cart.GetSavedAsync(UserId()));

    [HttpGet("summary")]
    public async Task<ActionResult<CartSummaryDto>> GetSummary() => Ok(await _cart.GetSummaryAsync(UserId()));

    [HttpPost("items")]
    public async Task<IActionResult> AddItem(AddToCartRequest request)
    {
        var result = await _cart.AddToCartAsync(UserId(), request.ProductId, request.Quantity);
        if (!result.Success) return UnprocessableEntity(new ProblemDetails { Title = result.Message });
        return Ok(result.Data);
    }

    [HttpPut("items/{productId:int}")]
    public async Task<IActionResult> UpdateItem(int productId, UpdateQuantityRequest request)
    {
        var result = await _cart.UpdateQuantityAsync(UserId(), productId, request.Quantity);
        if (!result.Success) return UnprocessableEntity(new ProblemDetails { Title = result.Message });
        return Ok(result.Data);
    }

    [HttpDelete("items/{productId:int}")]
    public async Task<IActionResult> RemoveItem(int productId)
    {
        var result = await _cart.RemoveItemAsync(UserId(), productId);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return Ok(result.Data);
    }

    [HttpDelete]
    public async Task<IActionResult> Clear()
    {
        await _cart.ClearCartAsync(UserId());
        return NoContent();
    }

    [HttpPost("items/{productId:int}/save-for-later")]
    public async Task<IActionResult> SaveForLater(int productId)
    {
        var result = await _cart.SaveForLaterAsync(UserId(), productId);
        if (!result.Success) return UnprocessableEntity(new ProblemDetails { Title = result.Message });
        return NoContent();
    }

    [HttpPost("saved/{productId:int}/move-to-cart")]
    public async Task<IActionResult> MoveToCart(int productId)
    {
        var result = await _cart.MoveToCartAsync(UserId(), productId);
        if (!result.Success) return UnprocessableEntity(new ProblemDetails { Title = result.Message });
        return NoContent();
    }

    [HttpDelete("saved/{productId:int}")]
    public async Task<IActionResult> RemoveSaved(int productId)
    {
        await _cart.RemoveSavedAsync(UserId(), productId);
        return NoContent();
    }

    private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
