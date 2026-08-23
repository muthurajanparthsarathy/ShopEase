using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Cms.Dtos;
using ShopEase.Application.Features.Cms.Services;

namespace ShopEase.Api.Features.Cms.Controllers;

[ApiController]
[Route("api/cms")]
public class CmsController : ControllerBase
{
    private readonly ICmsService _cms;

    public CmsController(ICmsService cms) => _cms = cms;

    [HttpGet("published")]
    public async Task<ActionResult<CmsConfigDto>> GetPublished() => Ok(await _cms.GetPublishedAsync());

    [Authorize(Roles = "Admin")]
    [HttpPut("published")]
    public async Task<IActionResult> SavePublished(CmsConfigDto config)
    {
        await _cms.SavePublishedAsync(config);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("preview")]
    public async Task<ActionResult<CmsConfigDto>> GetPreview() => Ok(await _cms.GetPreviewAsync());

    [Authorize(Roles = "Admin")]
    [HttpPut("preview")]
    public async Task<IActionResult> SavePreview(CmsConfigDto config)
    {
        await _cms.SavePreviewAsync(config);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("reset")]
    public async Task<ActionResult<CmsConfigDto>> Reset()
    {
        await _cms.ResetAsync();
        return Ok(_cms.Defaults());
    }
}
