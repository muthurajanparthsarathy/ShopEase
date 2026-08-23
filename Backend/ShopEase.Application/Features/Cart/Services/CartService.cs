using ShopEase.Application.Common;
using ShopEase.Application.Features.Cart.Dtos;
using ShopEase.Application.Features.Coupons.Services;
using ShopEase.Domain.Features.Cart.Entities;
using ShopEase.Domain.Repositories;

namespace ShopEase.Application.Features.Cart.Services;

public class CartService : ICartService
{
    private readonly ICartRepository _cart;
    private readonly IProductRepository _products;
    private readonly ICouponService _coupons;

    public CartService(ICartRepository cart, IProductRepository products, ICouponService coupons)
    {
        _cart = cart;
        _products = products;
        _coupons = coupons;
    }

    public Task<List<CartItemDto>> GetCartAsync(int userId) => BuildDtosAsync(userId, saved: false);

    public Task<List<CartItemDto>> GetSavedAsync(int userId) => BuildDtosAsync(userId, saved: true);

    public async Task<Result<List<CartItemDto>>> AddToCartAsync(int userId, int productId, int quantity)
    {
        var product = await _products.GetByIdAsync(productId);
        if (product == null) return Result<List<CartItemDto>>.Fail("Product not found.");
        if (!product.IsActive) return Result<List<CartItemDto>>.Fail("Product is no longer available.");
        if (product.Stock <= 0) return Result<List<CartItemDto>>.Fail("Product is out of stock.");

        var existing = await _cart.GetItemAsync(userId, productId, saved: false);
        var currentQty = existing?.Quantity ?? 0;
        if (currentQty + quantity > product.Stock)
            return Result<List<CartItemDto>>.Fail($"Only {product.Stock - currentQty} more available.");

        await _cart.UpsertAsync(new CartItem { UserId = userId, ProductId = productId, Quantity = currentQty + quantity, IsSaved = false });

        return Result<List<CartItemDto>>.Ok(await BuildDtosAsync(userId, saved: false), $"{product.Name} added to cart.");
    }

    public async Task<Result<List<CartItemDto>>> UpdateQuantityAsync(int userId, int productId, int quantity)
    {
        if (quantity <= 0) return await RemoveItemAsync(userId, productId);

        var item = await _cart.GetItemAsync(userId, productId, saved: false);
        if (item == null) return Result<List<CartItemDto>>.Fail("Item not found in cart.");

        var product = await _products.GetByIdAsync(productId);
        if (product != null && quantity > product.Stock)
            return Result<List<CartItemDto>>.Fail($"Only {product.Stock} available in stock.");

        await _cart.UpsertAsync(new CartItem { UserId = userId, ProductId = productId, Quantity = quantity, IsSaved = false });

        return Result<List<CartItemDto>>.Ok(await BuildDtosAsync(userId, saved: false), "Cart updated.");
    }

    public async Task<Result<List<CartItemDto>>> RemoveItemAsync(int userId, int productId)
    {
        var item = await _cart.GetItemAsync(userId, productId, saved: false);
        if (item == null) return Result<List<CartItemDto>>.Fail("Item not found in cart.");

        var product = await _products.GetByIdAsync(productId);
        await _cart.RemoveAsync(userId, productId, saved: false);

        return Result<List<CartItemDto>>.Ok(await BuildDtosAsync(userId, saved: false), $"{product?.Name ?? "Item"} removed from cart.");
    }

    public async Task<Result> ClearCartAsync(int userId)
    {
        await _cart.ClearCartAsync(userId);
        await _coupons.RemoveAppliedAsync(userId);
        return Result.Ok("Cart cleared.");
    }

    public async Task<CartSummaryDto> GetSummaryAsync(int userId)
    {
        var items = await BuildDtosAsync(userId, saved: false);
        var subtotal = items.Sum(i => i.Price * i.Quantity);
        var shipping = subtotal >= 500 ? 0m : subtotal > 0 ? 50m : 0m;
        decimal discount = 0;
        string? coupon = null;

        var code = await _coupons.GetAppliedCodeAsync(userId);
        if (code != null && subtotal > 0)
        {
            var validation = await _coupons.ValidateAsync(code, subtotal);
            if (validation.Valid)
            {
                coupon = validation.Code;
                if (validation.Coupon!.Type == "freeship") shipping = 0;
                else discount = _coupons.ComputeDiscount(validation.Coupon, subtotal);
            }
            else
            {
                // Coupon no longer valid (e.g. subtotal dropped below its minimum) — drop it silently.
                await _coupons.RemoveAppliedAsync(userId);
            }
        }

        var taxable = Math.Max(0, subtotal - discount);
        var tax = Math.Round(taxable * 0.18m, 2);
        var total = Math.Round(taxable + tax + shipping, 2);

        return new CartSummaryDto
        {
            Items = items,
            ItemCount = items.Sum(i => i.Quantity),
            Subtotal = subtotal,
            Discount = discount,
            Coupon = coupon,
            Tax = tax,
            Shipping = shipping,
            Total = total,
        };
    }

    public async Task<Result> SaveForLaterAsync(int userId, int productId)
    {
        var item = await _cart.GetItemAsync(userId, productId, saved: false);
        if (item == null) return Result.Fail("Item not in cart.");

        var product = await _products.GetByIdAsync(productId);
        await _cart.UpsertAsync(new CartItem { UserId = userId, ProductId = productId, Quantity = item.Quantity, IsSaved = true });
        await _cart.RemoveAsync(userId, productId, saved: false);

        return Result.Ok($"{product?.Name ?? "Item"} saved for later.");
    }

    public async Task<Result> MoveToCartAsync(int userId, int productId)
    {
        var saved = await _cart.GetItemAsync(userId, productId, saved: true);
        if (saved == null) return Result.Fail("Item not found.");

        var addResult = await AddToCartAsync(userId, productId, saved.Quantity);
        if (!addResult.Success) return Result.Fail(addResult.Message!);

        await _cart.RemoveAsync(userId, productId, saved: true);
        return Result.Ok(addResult.Message);
    }

    public async Task<Result> RemoveSavedAsync(int userId, int productId)
    {
        var product = await _products.GetByIdAsync(productId);
        await _cart.RemoveAsync(userId, productId, saved: true);
        return Result.Ok($"{product?.Name ?? "Item"} removed.");
    }

    /// <summary>
    /// Cart items store only (UserId, ProductId, Quantity) — name/brand/price are joined live from the
    /// Product table rather than snapshotted, so cart totals always reflect current pricing (the same
    /// data PlaceOrder re-validates against anyway).
    /// </summary>
    private async Task<List<CartItemDto>> BuildDtosAsync(int userId, bool saved)
    {
        var items = await _cart.GetItemsAsync(userId, saved);
        if (items.Count == 0) return new List<CartItemDto>();

        var products = await _products.GetAllAsync();
        var byId = products.ToDictionary(p => p.Id);

        return items
            .Where(i => byId.ContainsKey(i.ProductId))
            .Select(i =>
            {
                var p = byId[i.ProductId];
                return new CartItemDto { ProductId = p.Id, Name = p.Name, Brand = p.Brand, Price = p.Price, Quantity = i.Quantity };
            })
            .ToList();
    }
}
