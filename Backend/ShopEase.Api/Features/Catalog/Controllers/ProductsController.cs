using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Catalog.Dtos;
using ShopEase.Application.Features.Catalog.Services;

namespace ShopEase.Api.Features.Catalog.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _products;

    public ProductsController(IProductService products) => _products = products;

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetAll() => Ok(await _products.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await _products.GetByIdAsync(id);
        return product == null ? NotFound() : Ok(product);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ProductDto>> Add(ProductCreateRequest request)
    {
        var result = await _products.AddAsync(request);
        if (!result.Success) return Conflict(Problem(result.Message));
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> Update(int id, ProductUpdateRequest request)
    {
        var result = await _products.UpdateAsync(id, request);
        if (!result.Success) return result.Message == "Product not found." ? NotFound(Problem(result.Message)) : Conflict(Problem(result.Message));
        return Ok(result.Data);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _products.DeleteAsync(id);
        if (!result.Success) return NotFound(Problem(result.Message));
        return NoContent();
    }

    private static ProblemDetails Problem(string? message) => new() { Title = message ?? "Request failed." };
}
