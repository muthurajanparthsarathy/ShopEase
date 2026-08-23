namespace ShopEase.Application.Abstractions;

/// <summary>Lets services stamp audit entries with "who" without threading userId through every method
/// signature. Implemented in the Api layer (the only layer allowed to know about HttpContext).</summary>
public interface ICurrentUserService
{
    int? UserId { get; }
    string? Email { get; }
    string? IpAddress { get; }
}
