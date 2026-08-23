using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShopEase.Application.Features.Backup.Services;
using ShopEase.Application.Options;
using ShopEase.Domain.Repositories;

namespace ShopEase.Infrastructure.BackgroundJobs;

/// <summary>
/// Polls active, non-Manual backup jobs and runs whichever are due. No external scheduler (Hangfire/
/// Quartz) — a plain timed BackgroundService is all one background job needs at this scale.
/// </summary>
public class BackupJobBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly BackgroundJobOptions _options;
    private readonly ILogger<BackupJobBackgroundService> _logger;

    public BackupJobBackgroundService(IServiceScopeFactory scopeFactory, IOptions<BackgroundJobOptions> options, ILogger<BackupJobBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(Math.Max(5, _options.BackupPollIntervalSeconds));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunDueJobsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Backup scheduler tick failed");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // Shutting down.
            }
        }
    }

    private async Task RunDueJobsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var jobRepo = scope.ServiceProvider.GetRequiredService<IBackupJobRepository>();
        var backupService = scope.ServiceProvider.GetRequiredService<IBackupService>();

        var candidates = await jobRepo.GetActiveScheduledAsync();
        foreach (var job in candidates)
        {
            if (ct.IsCancellationRequested) return;
            if (!IsDue(job.Schedule, job.LastRunAt)) continue;

            _logger.LogInformation("Running due backup job {JobName} (schedule: {Schedule})", job.Name, job.Schedule);
            await backupService.RunJobAsync(job.Id);
        }
    }

    private static bool IsDue(string schedule, DateTime? lastRunAt)
    {
        if (lastRunAt == null) return true;

        var interval = schedule switch
        {
            "Hourly" => TimeSpan.FromHours(1),
            "Daily" => TimeSpan.FromDays(1),
            "Weekly" => TimeSpan.FromDays(7),
            "Monthly" => TimeSpan.FromDays(30),
            _ => (TimeSpan?)null, // "Manual" never auto-runs
        };

        return interval != null && DateTime.UtcNow - lastRunAt.Value >= interval;
    }
}
