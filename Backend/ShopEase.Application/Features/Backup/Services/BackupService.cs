using System.Text.Json;
using ShopEase.Application.Abstractions;
using ShopEase.Application.Common;
using ShopEase.Application.Features.Backup.Dtos;
using ShopEase.Domain.Features.Backup.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Backup.Services;

public class BackupService : IBackupService
{
    private readonly IBackupJobRepository _jobs;
    private readonly IBackupSnapshotRepository _snapshots;
    private readonly ILogRepository _logs;
    private readonly IBackupDataExporter _exporter;

    public BackupService(IBackupJobRepository jobs, IBackupSnapshotRepository snapshots, ILogRepository logs, IBackupDataExporter exporter)
    {
        _jobs = jobs;
        _snapshots = snapshots;
        _logs = logs;
        _exporter = exporter;
    }

    public IReadOnlyList<string> AvailableEntities => _exporter.AvailableEntities;
    public IReadOnlyList<string> RestorableEntities => _exporter.RestorableEntities;

    public async Task<List<BackupJobDto>> GetJobsAsync() => (await _jobs.GetAllAsync()).Select(ToDto).ToList();

    public async Task<Result<BackupJobDto>> AddJobAsync(BackupJobRequest request)
    {
        var job = new BackupJob
        {
            Name = request.Name,
            SourceJson = JsonSerializer.Serialize(request.Source),
            Type = request.Type,
            Schedule = request.Schedule,
            Retention = request.Retention,
            Active = request.Active,
            CreatedAt = DateTime.UtcNow,
        };
        await _jobs.AddAsync(job);
        return Result<BackupJobDto>.Ok(ToDto(job), "Backup job created.");
    }

    public async Task<Result<BackupJobDto>> UpdateJobAsync(int id, BackupJobRequest request)
    {
        var job = await _jobs.GetByIdAsync(id);
        if (job == null) return Result<BackupJobDto>.Fail("Backup job not found.");

        job.Name = request.Name;
        job.SourceJson = JsonSerializer.Serialize(request.Source);
        job.Type = request.Type;
        job.Schedule = request.Schedule;
        job.Retention = request.Retention;
        job.Active = request.Active;

        await _jobs.UpdateAsync(job);
        return Result<BackupJobDto>.Ok(ToDto(job), "Backup job updated.");
    }

    public async Task<Result> DeleteJobAsync(int id)
    {
        var job = await _jobs.GetByIdAsync(id);
        if (job == null) return Result.Fail("Backup job not found.");
        await _jobs.DeleteAsync(id);
        return Result.Ok("Backup job deleted.");
    }

    public async Task<RunJobResultDto> RunJobAsync(int id)
    {
        var job = await _jobs.GetByIdAsync(id);
        if (job == null) return new RunJobResultDto { Success = false, Error = "Backup job not found." };

        try
        {
            var source = JsonSerializer.Deserialize<List<string>>(job.SourceJson) ?? new List<string>();
            var exported = await _exporter.ExportAsync(source);
            var records = exported.Values.Sum(v => v is System.Collections.ICollection c ? c.Count : 0);

            await _snapshots.AddAsync(new BackupSnapshot
            {
                JobName = job.Name,
                DataJson = JsonSerializer.Serialize(exported),
                IsStaging = false,
                CreatedAt = DateTime.UtcNow,
            });
            await _snapshots.TrimAsync(job.Name, job.Retention);

            job.LastRunAt = DateTime.UtcNow;
            await _jobs.UpdateAsync(job);

            await _logs.AddAsync($"Backup completed: {job.Name} — {source.Count} entities, {records} records");
            return new RunJobResultDto { Success = true, Records = records };
        }
        catch (Exception ex)
        {
            await _logs.AddAsync($"Backup failed: {job.Name} — {ex.Message}");
            return new RunJobResultDto { Success = false, Error = ex.Message };
        }
    }

    public async Task<List<string>> GetActivityAsync() =>
        (await _logs.GetRecentAsync(40)).Select(l => $"{l.Timestamp:yyyy-MM-dd HH:mm:ss} — {l.Message}").ToList();

    public async Task<Dictionary<string, int>> GetEntityCountsAsync()
    {
        var counts = new Dictionary<string, int>();
        foreach (var entity in AvailableEntities) counts[entity] = await _exporter.CountAsync(entity);
        return counts;
    }

    public async Task<object> ExportAsync(List<string> entityNames, string exportedByEmail)
    {
        var data = await _exporter.ExportAsync(entityNames);
        return new Dictionary<string, object>(data)
        {
            ["_meta"] = new { app = "ShopEase E-Commerce", version = "1.0", exportedAt = DateTime.UtcNow, exportedBy = exportedByEmail },
        };
    }

    public RestoreValidationDto ValidateRestore(JsonElement data)
    {
        if (data.ValueKind != JsonValueKind.Object)
            return new RestoreValidationDto { Valid = false, Message = "Backup file must be a JSON object." };

        var counts = new Dictionary<string, int>();
        foreach (var entity in AvailableEntities)
        {
            if (data.TryGetProperty(entity, out var prop) && prop.ValueKind == JsonValueKind.Array)
                counts[entity] = prop.GetArrayLength();
        }

        if (counts.Count == 0)
            return new RestoreValidationDto { Valid = false, Message = "No recognizable entities found in this file." };

        string? exportedAt = null, exportedBy = null;
        if (data.TryGetProperty("_meta", out var meta) && meta.ValueKind == JsonValueKind.Object)
        {
            if (meta.TryGetProperty("exportedAt", out var at)) exportedAt = at.ToString();
            if (meta.TryGetProperty("exportedBy", out var by)) exportedBy = by.ToString();
        }

        return new RestoreValidationDto { Valid = true, EntityCounts = counts, ExportedAt = exportedAt, ExportedBy = exportedBy };
    }

    public async Task StageRestoreAsync(JsonElement data, List<string> scope)
    {
        var scoped = new Dictionary<string, JsonElement>();
        foreach (var entity in scope)
        {
            if (data.TryGetProperty(entity, out var prop)) scoped[entity] = prop;
        }

        await _snapshots.SetStagingAsync(new BackupSnapshot
        {
            JobName = "Manual Restore",
            DataJson = JsonSerializer.Serialize(scoped),
            CreatedAt = DateTime.UtcNow,
        });

        await _logs.AddAsync($"Restore staged: {scope.Count} entities validated & staged for review");
    }

    public async Task<RestoreValidationDto?> GetStagedAsync()
    {
        var staging = await _snapshots.GetStagingAsync();
        if (staging == null) return null;

        var scoped = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(staging.DataJson) ?? new();
        return new RestoreValidationDto { Valid = true, EntityCounts = scoped.ToDictionary(kv => kv.Key, kv => kv.Value.GetArrayLength()) };
    }

    public async Task<List<Result>> ExecuteRestoreAsync(List<string> scope)
    {
        var staging = await _snapshots.GetStagingAsync();
        if (staging == null) return new List<Result> { Result.Fail("Nothing is staged for restore.") };

        var scoped = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(staging.DataJson) ?? new();
        var results = new List<Result>();

        foreach (var entity in scope)
        {
            if (!scoped.TryGetValue(entity, out var entityData))
            {
                results.Add(Result.Fail($"'{entity}' was not part of the staged restore."));
                continue;
            }
            results.Add(await _exporter.RestoreAsync(entity, entityData));
        }

        await _snapshots.ClearStagingAsync();
        await _logs.AddAsync($"Restore executed: {scope.Count} entities applied to production");
        return results;
    }

    public async Task ResetAllDataAsync()
    {
        await _exporter.ResetAllAsync();
        await _logs.AddAsync("System reset to default demo data.");
    }

    private static BackupJobDto ToDto(BackupJob j) => new()
    {
        Id = j.Id,
        Name = j.Name,
        Source = JsonSerializer.Deserialize<List<string>>(j.SourceJson) ?? new(),
        Type = j.Type,
        Schedule = j.Schedule,
        Retention = j.Retention,
        Active = j.Active,
        CreatedAt = j.CreatedAt,
        LastRunAt = j.LastRunAt,
    };
}
