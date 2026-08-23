using ShopEase.Application.Abstractions;

namespace ShopEase.Api.Tests.Features.Catalog;

/// <summary>Always-miss cache for tests — isolates service logic from caching behavior.</summary>
public class NoopCacheService : ICacheService
{
    public bool TryGet<T>(string key, out T? value)
    {
        value = default;
        return false;
    }

    public void Set<T>(string key, T value, TimeSpan ttl) { }

    public void Remove(string key) { }
}
