using Microsoft.EntityFrameworkCore;
using ShopEase.Application.Features.Notifications.Services;
using ShopEase.Application.Features.Payments.Dtos;
using ShopEase.Application.Features.Payments.Services;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Payments;

public class PaymentServiceTests
{
    private ShopEaseDbContext _db = null!;

    [SetUp]
    public void SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    private PaymentService BuildService(bool gatewaySucceeds) =>
        new(new PaymentRepository(_db), new FakePaymentGateway(gatewaySucceeds), new NotificationService(new NotificationRepository(_db)));

    [Test]
    public async Task Process_CashOnDelivery_NeverCallsGateway_AndIsPending()
    {
        var service = BuildService(gatewaySucceeds: false); // gateway would fail, but CoD must never call it

        var result = await service.ProcessAsync(1, new ProcessPaymentRequest { OrderId = 1, Method = "Cash on Delivery", Amount = 100 });

        Assert.That(result.Success, Is.True);
        Assert.That(result.Data!.Status, Is.EqualTo("Pending"));
        Assert.That(result.Data.TransactionId, Is.Null);
    }

    [Test]
    public async Task Process_GatewaySucceeds_MarksCompleted()
    {
        var service = BuildService(gatewaySucceeds: true);

        var result = await service.ProcessAsync(1, new ProcessPaymentRequest { OrderId = 1, Method = "Credit Card", Amount = 100, CardNumber = "4111111111111234" });

        Assert.That(result.Success, Is.True);
        Assert.That(result.Data!.Status, Is.EqualTo("Completed"));
        Assert.That(result.Data.TransactionId, Is.Not.Null);
    }

    [Test]
    public async Task Process_GatewayFails_MarksPending_NotFailed()
    {
        var service = BuildService(gatewaySucceeds: false);

        var result = await service.ProcessAsync(1, new ProcessPaymentRequest { OrderId = 1, Method = "Credit Card", Amount = 100, CardNumber = "4111111111111234" });

        // Success=false signals "not confirmed yet", but the persisted status is Pending (needs
        // reconciliation), never a hard "Failed" — matches the resilience-fallback design.
        Assert.That(result.Success, Is.False);
        Assert.That(result.Data!.Status, Is.EqualTo("Pending"));
    }

    [Test]
    public async Task Process_CreditCard_MasksCardNumber_ShowsOnlyLast4()
    {
        var service = BuildService(gatewaySucceeds: true);

        var result = await service.ProcessAsync(1, new ProcessPaymentRequest
        {
            OrderId = 1, Method = "Credit Card", Amount = 100, CardNumber = "4111111111111234", CardHolder = "Jane Doe",
        });

        Assert.That(result.Data!.Details.CardLast4, Is.EqualTo("1234"));
        Assert.That(result.Data.Details.CardHolder, Is.EqualTo("Jane Doe"));
    }

    [Test]
    public async Task Process_Upi_MasksToUpiIdOnly()
    {
        var service = BuildService(gatewaySucceeds: true);

        var result = await service.ProcessAsync(1, new ProcessPaymentRequest { OrderId = 1, Method = "UPI", Amount = 100, UpiId = "user@bank" });

        Assert.That(result.Data!.Details.UpiId, Is.EqualTo("user@bank"));
        Assert.That(result.Data.Details.CardLast4, Is.Null);
    }
}
