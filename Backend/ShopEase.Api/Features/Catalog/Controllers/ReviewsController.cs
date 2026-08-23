using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Catalog.Dtos;
using ShopEase.Application.Features.Catalog.Services;

namespace ShopEase.Api.Features.Catalog.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;

    public ReviewsController(IReviewService reviews) => _reviews = reviews;

    [HttpGet("product/{productId:int}")]
    public async Task<ActionResult<List<ReviewDto>>> GetForProduct(int productId) => Ok(await _reviews.GetForProductAsync(productId));

    [HttpGet("stats/product/{productId:int}")]
    public async Task<ActionResult<ReviewStatsDto>> GetStats(int productId) => Ok(await _reviews.GetStatsAsync(productId));

    [HttpGet("stats")]
    public async Task<ActionResult<Dictionary<int, ReviewStatsDto>>> GetStatsForAll() => Ok(await _reviews.GetStatsForAllAsync());

    [Authorize]
    [HttpGet("has-reviewed")]
    public async Task<ActionResult<bool>> HasReviewed([FromQuery] int productId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _reviews.HasReviewedAsync(userId, productId));
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReviewDto>> Add(ReviewCreateRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userName = User.FindFirstValue(ClaimTypes.Name)!;

        var result = await _reviews.AddAsync(request, userId, userName);
        return CreatedAtAction(nameof(GetForProduct), new { productId = request.ProductId }, result.Data);
    }
}
