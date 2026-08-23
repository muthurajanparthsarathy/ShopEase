using Microsoft.EntityFrameworkCore;
using ShopEase.Domain.Features.Cms.Entities;
using ShopEase.Domain.Repositories;
using ShopEase.Infrastructure.Data;

namespace ShopEase.Infrastructure.Repositories;

/// <summary>Id=1 is the published config, Id=2 is the admin's live-preview draft (see CmsConfig).</summary>
public class CmsRepository : ICmsRepository
{
    private const int PublishedId = 1;
    private const int PreviewId = 2;

    private readonly ShopEaseDbContext _db;

    public CmsRepository(ShopEaseDbContext db) => _db = db;

    public Task<CmsConfig?> GetPublishedAsync() => _db.CmsConfigs.AsNoTracking().FirstOrDefaultAsync(c => c.Id == PublishedId);

    public Task SavePublishedAsync(string heroJson, string sectionsJson) => UpsertAsync(PublishedId, heroJson, sectionsJson);

    public Task<CmsConfig?> GetPreviewAsync() => _db.CmsConfigs.AsNoTracking().FirstOrDefaultAsync(c => c.Id == PreviewId);

    public Task SavePreviewAsync(string heroJson, string sectionsJson) => UpsertAsync(PreviewId, heroJson, sectionsJson);

    public async Task ResetPublishedAsync()
    {
        var existing = await _db.CmsConfigs.FirstOrDefaultAsync(c => c.Id == PublishedId);
        if (existing == null) return;
        _db.CmsConfigs.Remove(existing);
        await _db.SaveChangesAsync();
    }

    private async Task UpsertAsync(int id, string heroJson, string sectionsJson)
    {
        var existing = await _db.CmsConfigs.FirstOrDefaultAsync(c => c.Id == id);
        if (existing == null)
        {
            _db.CmsConfigs.Add(new CmsConfig { Id = id, HeroJson = heroJson, SectionsJson = sectionsJson });
        }
        else
        {
            existing.HeroJson = heroJson;
            existing.SectionsJson = sectionsJson;
        }

        await _db.SaveChangesAsync();
    }
}
