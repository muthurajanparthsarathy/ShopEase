using ShopEase.Application.Common;
using ShopEase.Application.Features.Cart.Dtos;

namespace ShopEase.Application.Features.Cart.Services;

public interface ICartService
{
    Task<List<CartItemDto>> GetCartAsync(int userId);
    Task<List<CartItemDto>> GetSavedAsync(int userId);
    Task<Result<List<CartItemDto>>> AddToCartAsync(int userId, int productId, int quantity);
    Task<Result<List<CartItemDto>>> UpdateQuantityAsync(int userId, int productId, int quantity);
    Task<Result<List<CartItemDto>>> RemoveItemAsync(int userId, int productId);
    Task<Result> ClearCartAsync(int userId);
    Task<CartSummaryDto> GetSummaryAsync(int userId);
    Task<Result> SaveForLaterAsync(int userId, int productId);
    Task<Result> MoveToCartAsync(int userId, int productId);
    Task<Result> RemoveSavedAsync(int userId, int productId);
}
