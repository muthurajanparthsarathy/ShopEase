using System.Text.Json;
using ShopEase.Application.Common;
using ShopEase.Application.Features.Backup.Dtos;

namespace ShopEase.Application.Features.Backup.Services;

public interface IBackupService
{
    Task<List<BackupJobDto>> GetJobsAsync();
    Task<Result<BackupJobDto>> AddJobAsync(BackupJobRequest request);
    Task<Result<BackupJobDto>> UpdateJobAsync(int id, BackupJobRequest request);
    Task<Result> DeleteJobAsync(int id);
    Task<RunJobResultDto> RunJobAsync(int id);

    Task<List<string>> GetActivityAsync();
    Task<Dictionary<string, int>> GetEntityCountsAsync();
    IReadOnlyList<string> AvailableEntities { get; }
    IReadOnlyList<string> RestorableEntities { get; }

    Task<object> ExportAsync(List<string> entityNames, string exportedByEmail);
    RestoreValidationDto ValidateRestore(JsonElement data);
    Task StageRestoreAsync(JsonElement data, List<string> scope);
    Task<RestoreValidationDto?> GetStagedAsync();
    Task<List<Result>> ExecuteRestoreAsync(List<string> scope);

    Task ResetAllDataAsync();
}
