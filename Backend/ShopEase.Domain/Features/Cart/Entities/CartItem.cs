namespace ShopEase.Domain.Features.Cart.Entities;

public class CartItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }

    /// <summary>False = active cart, true = "save for later" — replaces the two separate localStorage keys.</summary>
    public bool IsSaved { get; set; }
}
