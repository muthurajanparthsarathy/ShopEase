using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Catalog.Dtos;
using ShopEase.Application.Features.Catalog.Services;

namespace ShopEase.Api.Features.Catalog.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categories;

    public CategoriesController(ICategoryService categories) => _categories = categories;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll() => Ok(await _categories.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var category = await _categories.GetByIdAsync(id);
        return category == null ? NotFound() : Ok(category);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Add(CategoryCreateRequest request)
    {
        var result = await _categories.AddAsync(request);
        if (!result.Success) return Conflict(Problem(result.Message));
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, CategoryUpdateRequest request)
    {
        var result = await _categories.UpdateAsync(id, request);
        if (!result.Success) return result.Message == "Category not found." ? NotFound(Problem(result.Message)) : Conflict(Problem(result.Message));
        return Ok(result.Data);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _categories.DeleteAsync(id);
        if (!result.Success) return Conflict(Problem(result.Message));
        return NoContent();
    }

    private static ProblemDetails Problem(string? message) => new() { Title = message ?? "Request failed." };
}
