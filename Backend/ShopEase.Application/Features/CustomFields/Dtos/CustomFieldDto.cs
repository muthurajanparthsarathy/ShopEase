using System.ComponentModel.DataAnnotations;

namespace ShopEase.Application.Features.CustomFields.Dtos;

public class CustomFieldDto
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public bool Required { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CustomFieldCreateRequest
{
    [Required]
    public string Label { get; set; } = string.Empty;

    /// <summary>"order" | "product" | "customer" | "category".</summary>
    [Required]
    public string Entity { get; set; } = string.Empty;

    /// <summary>"text" | "number" | "date" | "dropdown" | "checkbox".</summary>
    [Required]
    public string Type { get; set; } = string.Empty;

    public List<string> Options { get; set; } = new();
    public bool Required { get; set; }
}

public class CustomFieldUpdateRequest
{
    public string? Label { get; set; }
    public List<string>? Options { get; set; }
    public bool? Required { get; set; }
    public bool? Active { get; set; }
}
