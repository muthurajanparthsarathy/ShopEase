using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ShopEase.Application.Features.Backup.Dtos;
using ShopEase.Application.Features.Backup.Services;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Infrastructure.Backup;
using ShopEase.Infrastructure.Caching;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Backup;

public class BackupServiceTests
{
    private ShopEaseDbContext _db = null!;
    private BackupService _backup = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);
        var cache = new MemoryCacheService(new MemoryCache(new MemoryCacheOptions()));
        _backup = new BackupService(
            new BackupJobRepository(_db), new BackupSnapshotRepository(_db), new LogRepository(_db), new BackupDataExporter(_db, cache));
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    private static BackupJobRequest SampleJob(string schedule = "Manual") => new()
    {
        Name = "Test Job", Source = new List<string> { "Products", "Categories" }, Type = "Full", Schedule = schedule, Retention = 5, Active = true,
    };

    [Test]
    public async Task AddJob_Then_GetJobs_ReturnsIt()
    {
        await _backup.AddJobAsync(SampleJob());
        var jobs = await _backup.GetJobsAsync();

        Assert.That(jobs, Has.Count.EqualTo(1));
        Assert.That(jobs[0].Source, Is.EquivalentTo(new[] { "Products", "Categories" }));
    }

    [Test]
    public async Task RunJob_UpdatesLastRunAt_AndLogsActivity()
    {
        var job = await _backup.AddJobAsync(SampleJob());
        _db.ChangeTracker.Clear(); // simulate the fresh DbContext a separate "run job" request would get

        var result = await _backup.RunJobAsync(job.Data!.Id);

        Assert.That(result.Success, Is.True);
        var jobs = await _backup.GetJobsAsync();
        Assert.That(jobs[0].LastRunAt, Is.Not.Null);

        var activity = await _backup.GetActivityAsync();
        Assert.That(activity, Has.Count.EqualTo(1));
        Assert.That(activity[0], Does.Contain("Test Job"));
    }

    [Test]
    public async Task DeleteJob_NonExistent_Fails()
    {
        var result = await _backup.DeleteJobAsync(999);
        Assert.That(result.Success, Is.False);
    }

    [Test]
    public async Task RestoreRoundTrip_RevertsExistingRowToExportedValues()
    {
        _db.Categories.Add(new Category { Id = 1, Name = "Cat A", Description = "", IsActive = true });
        _db.Products.Add(new Product { Id = 1, Name = "Original Name", Brand = "B", Sku = "SKU-1", Price = 10, Stock = 5, CategoryId = 1 });
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var exported = await _backup.ExportAsync(new List<string> { "Products" }, "admin@example.com");
        var exportedJson = JsonSerializer.SerializeToElement(exported);

        // Simulate a bad edit after the export was taken.
        var product = await _db.Products.FirstAsync(p => p.Id == 1);
        product.Name = "Bad Edit";
        product.Price = 99999;
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var validation = _backup.ValidateRestore(exportedJson);
        Assert.That(validation.Valid, Is.True);
        Assert.That(validation.EntityCounts["Products"], Is.EqualTo(1));

        await _backup.StageRestoreAsync(exportedJson, new List<string> { "Products" });
        var results = await _backup.ExecuteRestoreAsync(new List<string> { "Products" });

        Assert.That(results.Single().Success, Is.True);
        var reverted = await _db.Products.AsNoTracking().FirstAsync(p => p.Id == 1);
        Assert.That(reverted.Name, Is.EqualTo("Original Name"));
        Assert.That(reverted.Price, Is.EqualTo(10));
    }

    [Test]
    public async Task Restore_NonRestorableEntity_Fails()
    {
        var data = JsonSerializer.SerializeToElement(new List<object>());

        var result = await new BackupDataExporter(_db, new MemoryCacheService(new MemoryCache(new MemoryCacheOptions()))).RestoreAsync("Orders", data);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("cannot be restored"));
    }
}
