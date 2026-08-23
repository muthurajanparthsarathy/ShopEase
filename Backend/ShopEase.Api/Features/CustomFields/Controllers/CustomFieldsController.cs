using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.CustomFields.Dtos;
using ShopEase.Application.Features.CustomFields.Services;

namespace ShopEase.Api.Features.CustomFields.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/custom-fields")]
public class CustomFieldsController : ControllerBase
{
    private readonly ICustomFieldService _fields;

    public CustomFieldsController(ICustomFieldService fields) => _fields = fields;

    [HttpGet]
    public async Task<ActionResult<List<CustomFieldDto>>> GetForEntity([FromQuery] string entity, [FromQuery] bool includeInactive = false) =>
        Ok(await _fields.GetForEntityAsync(entity, includeInactive));

    [HttpPost]
    public async Task<ActionResult<CustomFieldDto>> Add(CustomFieldCreateRequest request)
    {
        var result = await _fields.AddAsync(request);
        return Ok(result.Data);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CustomFieldDto>> Update(int id, CustomFieldUpdateRequest request)
    {
        var result = await _fields.UpdateAsync(id, request);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return Ok(result.Data);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _fields.DeleteAsync(id);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return NoContent();
    }

    [HttpPatch("{id:int}/toggle-active")]
    public async Task<ActionResult<CustomFieldDto>> ToggleActive(int id)
    {
        var result = await _fields.ToggleActiveAsync(id);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return Ok(result.Data);
    }
}
