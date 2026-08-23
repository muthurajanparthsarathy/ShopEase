using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopEase.Domain.Repositories;

namespace ShopEase.Api.Features.Backup.Controllers;

/// <summary>Admin dashboard's "recent activity" feed — same underlying LogEntry data the Backup
/// feature's activity log reads, exposed under a clearer top-level path.</summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/logs")]
public class LogsController : ControllerBase
{
    private readonly ILogRepository _logs;

    public LogsController(ILogRepository logs) => _logs = logs;

    [HttpGet]
    public async Task<IActionResult> GetRecent([FromQuery] int limit = 100)
    {
        var logs = await _logs.GetRecentAsync(limit);
        return Ok(logs.Select(l => new { l.Id, l.Timestamp, l.Message }));
    }
}
