using Microsoft.Extensions.Options;
using ShopEase.Application.Abstractions;
using ShopEase.Application.Options;

namespace ShopEase.Infrastructure.Payments;

/// <summary>
/// Stands in for a real Razorpay integration: amount would be paise/INR on the wire, order+capture
/// as two calls — collapsed here into one simulated charge with configurable latency and failure rate.
/// </summary>
public class RazorpaySimulatorGateway : IPaymentGateway
{
    private readonly PaymentGatewayOptions _options;

    public RazorpaySimulatorGateway(IOptions<PaymentGatewayOptions> options) => _options = options.Value;

    public async Task<ChargeResult> ChargeAsync(ChargeRequest request, CancellationToken ct)
    {
        await Task.Delay(_options.SimulatedLatencyMs, ct);

        var success = Random.Shared.NextDouble() >= _options.FailureRate;
        var transactionId = success ? $"pay_{Guid.NewGuid():N}"[..17].ToUpperInvariant() : null;

        return new ChargeResult(success, transactionId);
    }
}
