using ShopEase.Application.Abstractions;

namespace ShopEase.Api.Tests.Features.Payments;

public class FakePaymentGateway : IPaymentGateway
{
    private readonly bool _succeeds;

    public FakePaymentGateway(bool succeeds) => _succeeds = succeeds;

    public Task<ChargeResult> ChargeAsync(ChargeRequest request, CancellationToken ct) =>
        Task.FromResult(_succeeds ? new ChargeResult(true, "TXN-TEST123") : new ChargeResult(false, null));
}
