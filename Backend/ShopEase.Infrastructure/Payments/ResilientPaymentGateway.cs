using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;
using Polly.Timeout;
using ShopEase.Application.Abstractions;

namespace ShopEase.Infrastructure.Payments;

/// <summary>
/// Wraps the raw gateway with retry -> circuit breaker -> timeout. If everything is exhausted, the
/// caller (PaymentService) treats the result as "needs manual reconciliation" (Payment stays Pending),
/// not a hard failure — see PaymentService.ProcessAsync.
/// </summary>
public class ResilientPaymentGateway : IPaymentGateway
{
    private readonly RazorpaySimulatorGateway _inner;
    private readonly ResiliencePipeline<ChargeResult> _pipeline;

    public ResilientPaymentGateway(RazorpaySimulatorGateway inner)
    {
        _inner = inner;
        _pipeline = new ResiliencePipelineBuilder<ChargeResult>()
            .AddRetry(new RetryStrategyOptions<ChargeResult>
            {
                ShouldHandle = new PredicateBuilder<ChargeResult>().HandleResult(r => !r.Success),
                MaxRetryAttempts = 2,
                BackoffType = DelayBackoffType.Exponential,
                Delay = TimeSpan.FromMilliseconds(300),
            })
            .AddCircuitBreaker(new CircuitBreakerStrategyOptions<ChargeResult>
            {
                ShouldHandle = new PredicateBuilder<ChargeResult>().HandleResult(r => !r.Success),
                FailureRatio = 0.8,
                MinimumThroughput = 5,
                SamplingDuration = TimeSpan.FromSeconds(30),
                BreakDuration = TimeSpan.FromSeconds(15),
            })
            .AddTimeout(TimeSpan.FromSeconds(10))
            .Build();
    }

    public async Task<ChargeResult> ChargeAsync(ChargeRequest request, CancellationToken ct)
    {
        try
        {
            return await _pipeline.ExecuteAsync(async token => await _inner.ChargeAsync(request, token), ct);
        }
        catch (BrokenCircuitException)
        {
            return new ChargeResult(false, null);
        }
        catch (TimeoutRejectedException)
        {
            return new ChargeResult(false, null);
        }
    }
}
