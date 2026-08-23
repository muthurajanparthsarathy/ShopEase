namespace ShopEase.Application.Abstractions;

public record ChargeRequest(string Method, decimal Amount, string? CardNumber, string? CardHolder, string? UpiId);

public record ChargeResult(bool Success, string? TransactionId);

public interface IPaymentGateway
{
    Task<ChargeResult> ChargeAsync(ChargeRequest request, CancellationToken ct);
}
