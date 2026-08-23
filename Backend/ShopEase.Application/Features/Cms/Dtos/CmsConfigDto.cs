using System.Text.Json;

namespace ShopEase.Application.Features.Cms.Dtos;

/// <summary>
/// Hero/Sections are opaque JSON — the backend has no business rules to enforce on CMS presentation
/// content, so it passes the frontend's shape through rather than modeling every section variant.
/// </summary>
public class CmsConfigDto
{
    public JsonElement Hero { get; set; }
    public JsonElement Sections { get; set; }
}
