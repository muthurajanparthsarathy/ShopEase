using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Application.Features.Backup.Dtos;
using ShopEase.Application.Features.Backup.Services;

namespace ShopEase.Api.Features.Backup.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/backup")]
public class BackupController : ControllerBase
{
    private readonly IBackupService _backup;

    public BackupController(IBackupService backup) => _backup = backup;

    [HttpGet("jobs")]
    public async Task<ActionResult<List<BackupJobDto>>> GetJobs() => Ok(await _backup.GetJobsAsync());

    [HttpPost("jobs")]
    public async Task<ActionResult<BackupJobDto>> AddJob(BackupJobRequest request)
    {
        var result = await _backup.AddJobAsync(request);
        return Ok(result.Data);
    }

    [HttpPut("jobs/{id:int}")]
    public async Task<ActionResult<BackupJobDto>> UpdateJob(int id, BackupJobRequest request)
    {
        var result = await _backup.UpdateJobAsync(id, request);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return Ok(result.Data);
    }

    [HttpDelete("jobs/{id:int}")]
    public async Task<IActionResult> DeleteJob(int id)
    {
        var result = await _backup.DeleteJobAsync(id);
        if (!result.Success) return NotFound(new ProblemDetails { Title = result.Message });
        return NoContent();
    }

    [HttpPost("jobs/{id:int}/run")]
    public async Task<ActionResult<RunJobResultDto>> RunJob(int id) => Ok(await _backup.RunJobAsync(id));

    [HttpGet("activity")]
    public async Task<ActionResult<List<string>>> GetActivity() => Ok(await _backup.GetActivityAsync());

    [HttpGet("entities")]
    public async Task<IActionResult> GetEntities() => Ok(new
    {
        available = _backup.AvailableEntities,
        restorable = _backup.RestorableEntities,
        counts = await _backup.GetEntityCountsAsync(),
    });

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] List<string> entities)
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? "admin";
        var data = await _backup.ExportAsync(entities, email);
        return Ok(data);
    }

    [HttpPost("restore/validate")]
    public ActionResult<RestoreValidationDto> ValidateRestore([FromBody] System.Text.Json.JsonElement data) =>
        Ok(_backup.ValidateRestore(data));

    [HttpPost("restore/stage")]
    public async Task<IActionResult> StageRestore(RestoreRequest request)
    {
        await _backup.StageRestoreAsync(request.Data, request.Scope);
        return NoContent();
    }

    [HttpGet("restore/staged")]
    public async Task<ActionResult<RestoreValidationDto>> GetStaged()
    {
        var staged = await _backup.GetStagedAsync();
        return staged == null ? NotFound() : Ok(staged);
    }

    [HttpPost("restore/execute")]
    public async Task<IActionResult> ExecuteRestore(ExecuteRestoreRequest request) =>
        Ok(await _backup.ExecuteRestoreAsync(request.Scope));

    [HttpPost("reset")]
    public async Task<IActionResult> Reset()
    {
        await _backup.ResetAllDataAsync();
        return NoContent();
    }
}
