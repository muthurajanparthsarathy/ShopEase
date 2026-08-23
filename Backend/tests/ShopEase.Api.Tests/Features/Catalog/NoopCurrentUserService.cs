using ShopEase.Application.Abstractions;

namespace ShopEase.Api.Tests.Features.Catalog;

/// <summary>Anonymous "current user" for tests — audit entries just get a null UserId.</summary>
public class NoopCurrentUserService : ICurrentUserService
{
    public int? UserId => null;
    public string? Email => null;
    public string? IpAddress => null;
}
