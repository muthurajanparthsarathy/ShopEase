using Microsoft.EntityFrameworkCore;
using ShopEase.Api.Tests.Features.Catalog;
using ShopEase.Application.Features.Auth.Dtos;
using ShopEase.Application.Features.Auth.Services;
using ShopEase.Application.Features.Cart.Services;
using ShopEase.Application.Features.Coupons.Services;
using ShopEase.Application.Features.Notifications.Services;
using ShopEase.Application.Features.Orders.Services;
using ShopEase.Domain.Features.Catalog.Entities;
using ShopEase.Infrastructure.Data;
using ShopEase.Infrastructure.Repositories;

namespace ShopEase.Api.Tests.Features.Orders;

public class OrderServiceTests
{
    private ShopEaseDbContext _db = null!;
    private OrderService _orders = null!;
    private CartService _cart = null!;
    private AddressService _addresses = null!;
    private Product _product = null!;
    private const int UserId = 1;
    private int _addressId;

    [SetUp]
    public async Task SetUp()
    {
        var dbOptions = new DbContextOptionsBuilder<ShopEaseDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new ShopEaseDbContext(dbOptions);

        _product = new Product { Name = "Mouse", Brand = "Logitech", Sku = "SKU-1", Price = 500, Stock = 5, CategoryId = 1 };
        _db.Products.Add(_product);
        await _db.SaveChangesAsync();
        // Detach the seeded instance — repositories re-fetch AsNoTracking, and a still-tracked
        // instance with the same key would collide when the service later calls Update() on it.
        _db.ChangeTracker.Clear();

        var productRepo = new ProductRepository(_db);
        var addressRepo = new AddressRepository(_db);
        var couponSvc = new CouponService(new CouponRepository(_db));
        _cart = new CartService(new CartRepository(_db), productRepo, couponSvc);
        _addresses = new AddressService(addressRepo);
        var notifications = new NotificationService(new NotificationRepository(_db));

        var addressResult = await _addresses.AddAsync(UserId, new AddressRequest
        {
            Label = "Home", Line = "123 St", City = "City", State = "ST", PostalCode = "123456",
        });
        _addressId = addressResult.Data!.Id;

        _orders = new OrderService(
            new OrderRepository(_db), productRepo, addressRepo, _cart, notifications,
            new AuditLogRepository(_db), new NoopCurrentUserService());
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    [Test]
    public async Task PlaceOrder_EmptyCart_Fails()
    {
        var result = await _orders.PlaceOrderAsync(UserId, _addressId, paymentMethodId: 1);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("cart is empty"));
    }

    [Test]
    public async Task PlaceOrder_InsufficientStock_Fails()
    {
        await _cart.AddToCartAsync(UserId, _product.Id, 3);
        _product.Stock = 1; // simulate stock dropping after it was added to cart
        _db.Products.Update(_product);
        await _db.SaveChangesAsync();

        var result = await _orders.PlaceOrderAsync(UserId, _addressId, paymentMethodId: 1);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("Insufficient stock"));
    }

    [Test]
    public async Task PlaceOrder_Success_DeductsStockAndClearsCart()
    {
        await _cart.AddToCartAsync(UserId, _product.Id, 2);

        var result = await _orders.PlaceOrderAsync(UserId, _addressId, paymentMethodId: 1);

        Assert.That(result.Success, Is.True);
        Assert.That(result.Data!.Status, Is.EqualTo("Pending"));
        Assert.That((await _cart.GetCartAsync(UserId)), Is.Empty);

        var product = await new ProductRepository(_db).GetByIdAsync(_product.Id);
        Assert.That(product!.Stock, Is.EqualTo(3)); // 5 - 2
    }

    [Test]
    public async Task PlaceOrder_WrongUsersAddress_Fails()
    {
        await _cart.AddToCartAsync(UserId, _product.Id, 1);
        var otherUsersAddress = await _addresses.AddAsync(userId: 999, new AddressRequest
        {
            Label = "Other", Line = "x", City = "x", State = "x", PostalCode = "111111",
        });

        var result = await _orders.PlaceOrderAsync(UserId, otherUsersAddress.Data!.Id, paymentMethodId: 1);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("delivery address"));
    }

    [Test]
    public async Task UpdateStatus_InvalidTransition_Rejected()
    {
        await _cart.AddToCartAsync(UserId, _product.Id, 1);
        var order = await _orders.PlaceOrderAsync(UserId, _addressId, 1);

        var result = await _orders.UpdateStatusAsync(order.Data!.Id, "Delivered"); // Pending -> Delivered is invalid

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("Cannot change status"));
    }

    [Test]
    public async Task Cancel_RestoresStock()
    {
        await _cart.AddToCartAsync(UserId, _product.Id, 2);
        var order = await _orders.PlaceOrderAsync(UserId, _addressId, 1);
        // PlaceOrderAsync leaves the Product tracked; clearing simulates the fresh DbContext a
        // separate "cancel" request would actually get, so the next GetAllAsync+Update doesn't collide.
        _db.ChangeTracker.Clear();

        var result = await _orders.CancelAsync(order.Data!.Id, UserId);

        Assert.That(result.Success, Is.True);
        var product = await new ProductRepository(_db).GetByIdAsync(_product.Id);
        Assert.That(product!.Stock, Is.EqualTo(5)); // fully restored
    }

    [Test]
    public async Task Cancel_ByDifferentUser_Unauthorized()
    {
        await _cart.AddToCartAsync(UserId, _product.Id, 1);
        var order = await _orders.PlaceOrderAsync(UserId, _addressId, 1);

        var result = await _orders.CancelAsync(order.Data!.Id, userId: 999);

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("Unauthorized"));
    }

    [Test]
    public async Task Return_OnlyAllowedFromDelivered()
    {
        await _cart.AddToCartAsync(UserId, _product.Id, 1);
        var order = await _orders.PlaceOrderAsync(UserId, _addressId, 1);

        var result = await _orders.ReturnAsync(order.Data!.Id, UserId); // still Pending, not Delivered

        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("delivered orders"));
    }

    [Test]
    public async Task Return_AfterDelivered_RestoresStock()
    {
        await _cart.AddToCartAsync(UserId, _product.Id, 2);
        var order = await _orders.PlaceOrderAsync(UserId, _addressId, 1);
        await _orders.UpdateStatusAsync(order.Data!.Id, "Processing");
        await _orders.UpdateStatusAsync(order.Data.Id, "Shipped");
        await _orders.UpdateStatusAsync(order.Data.Id, "Delivered");
        _db.ChangeTracker.Clear(); // simulate a fresh DbContext for the "return" request

        var result = await _orders.ReturnAsync(order.Data.Id, UserId);

        Assert.That(result.Success, Is.True);
        var product = await new ProductRepository(_db).GetByIdAsync(_product.Id);
        Assert.That(product!.Stock, Is.EqualTo(5));
    }
}
