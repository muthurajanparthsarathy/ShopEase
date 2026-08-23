using System.ComponentModel.DataAnnotations;

namespace ShopEase.Application.Features.Catalog.Dtos;

public class ProductCreateRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Brand { get; set; } = string.Empty;

    [Required]
    public string Sku { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    public int CategoryId { get; set; }
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, object>? Custom { get; set; }
}

public class ProductUpdateRequest
{
    public string? Name { get; set; }
    public string? Brand { get; set; }
    public string? Sku { get; set; }
    public decimal? Price { get; set; }
    public int? Stock { get; set; }
    public int? CategoryId { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
    public Dictionary<string, object>? Custom { get; set; }
}
