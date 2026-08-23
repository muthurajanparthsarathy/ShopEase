using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace ShopEase.Application.Features.Backup.Dtos;

public class BackupJobDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<string> Source { get; set; } = new();
    public string Type { get; set; } = string.Empty;
    public string Schedule { get; set; } = string.Empty;
    public int Retention { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastRunAt { get; set; }
}

public class BackupJobRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required, MinLength(1)]
    public List<string> Source { get; set; } = new();

    [Required]
    public string Type { get; set; } = "Full";

    [Required]
    public string Schedule { get; set; } = "Manual";

    [Range(1, 365)]
    public int Retention { get; set; } = 10;

    public bool Active { get; set; } = true;
}

public class RunJobResultDto
{
    public bool Success { get; set; }
    public int Records { get; set; }
    public string? Error { get; set; }
}

public class RestoreValidationDto
{
    public bool Valid { get; set; }
    public string? Message { get; set; }
    public Dictionary<string, int> EntityCounts { get; set; } = new();
    public string? ExportedAt { get; set; }
    public string? ExportedBy { get; set; }
}

public class RestoreRequest
{
    [Required]
    public JsonElement Data { get; set; }

    [Required, MinLength(1)]
    public List<string> Scope { get; set; } = new();
}

public class ExecuteRestoreRequest
{
    [Required, MinLength(1)]
    public List<string> Scope { get; set; } = new();
}
