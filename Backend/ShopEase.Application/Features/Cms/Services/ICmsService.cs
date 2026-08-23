using ShopEase.Application.Features.Cms.Dtos;

namespace ShopEase.Application.Features.Cms.Services;

public interface ICmsService
{
    Task<CmsConfigDto> GetPublishedAsync();
    Task SavePublishedAsync(CmsConfigDto config);
    Task<CmsConfigDto> GetPreviewAsync();
    Task SavePreviewAsync(CmsConfigDto config);
    Task ResetAsync();
    CmsConfigDto Defaults();
}
