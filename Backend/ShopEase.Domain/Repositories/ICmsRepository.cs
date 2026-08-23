using ShopEase.Domain.Features.Cms.Entities;

namespace ShopEase.Domain.Repositories;

public interface ICmsRepository
{
    Task<CmsConfig?> GetPublishedAsync();
    Task SavePublishedAsync(string heroJson, string sectionsJson);
    Task<CmsConfig?> GetPreviewAsync();
    Task SavePreviewAsync(string heroJson, string sectionsJson);
    Task ResetPublishedAsync();
}
