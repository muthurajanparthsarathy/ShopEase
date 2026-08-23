using System.ComponentModel.DataAnnotations;

namespace ShopEase.Application.Features.Catalog.Dtos;

public class ReviewDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ReviewCreateRequest
{
    [Required]
    public int ProductId { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    public string? Comment { get; set; }
}

public class ReviewStatsDto
{
    public double Avg { get; set; }
    public int Count { get; set; }
}
