using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Cart.Services;
using ShopEase.Application.Features.Coupons.Dtos;
using ShopEase.Application.Features.Coupons.Services;

namespace ShopEase.Api.Features.Coupons.Controllers;

[ApiController]
[Route("api/coupons")]
public class CouponsController : ControllerBase
{
    private readonly ICouponService _coupons;
    private readonly ICartService _cart;

    public CouponsController(ICouponService coupons, ICartService cart)
    {
        _coupons = coupons;
        _cart = cart;
    }

    [HttpGet]
    public async Task<ActionResult<List<CouponDto>>> List() => Ok(await _coupons.ListAsync());

    [Authorize]
    [HttpGet("applied")]
    public async Task<ActionResult<string?>> GetApplied() => Ok(await _coupons.GetAppliedCodeAsync(UserId()));

    [Authorize]
    [HttpPost("apply")]
    public async Task<ActionResult<CouponValidationResultDto>> Apply(ApplyCouponRequest request)
    {
        // Subtotal is computed server-side from the caller's own cart — never trust a client-supplied
        // amount here, or a coupon's minimum-order check could be bypassed.
        var summary = await _cart.GetSummaryAsync(UserId());
        var result = await _coupons.ApplyAsync(UserId(), request.Code, summary.Subtotal);
        if (!result.Valid) return UnprocessableEntity(new ProblemDetails { Title = result.Message });
        return Ok(result);
    }

    [Authorize]
    [HttpDelete("applied")]
    public async Task<IActionResult> RemoveApplied()
    {
        await _coupons.RemoveAppliedAsync(UserId());
        return NoContent();
    }

    private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
