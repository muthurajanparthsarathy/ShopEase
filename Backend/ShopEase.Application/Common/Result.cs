namespace ShopEase.Application.Common;

/// <summary>Uniform outcome shape for service mutations — mirrors the Angular app's Result&lt;T&gt; model.</summary>
public class Result<T>
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public T? Data { get; init; }

    public static Result<T> Ok(T data, string? message = null) => new() { Success = true, Data = data, Message = message };
    public static Result<T> Fail(string message) => new() { Success = false, Message = message };
}

public class Result
{
    public bool Success { get; init; }
    public string? Message { get; init; }

    public static Result Ok(string? message = null) => new() { Success = true, Message = message };
    public static Result Fail(string message) => new() { Success = false, Message = message };
}
