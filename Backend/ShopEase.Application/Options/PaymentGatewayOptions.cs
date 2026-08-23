namespace ShopEase.Application.Options;

public class PaymentGatewayOptions
{
    public const string SectionName = "PaymentGateway";

    /// <summary>Mimics real network/processing latency — matches the reference app's 1500ms payment delay.</summary>
    public int SimulatedLatencyMs { get; set; } = 1500;

    /// <summary>Fraction of charges that fail on any given attempt (0.05 = 5%, matching the reference app).</summary>
    public double FailureRate { get; set; } = 0.05;
}
