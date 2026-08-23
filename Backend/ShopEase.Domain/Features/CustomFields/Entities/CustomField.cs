namespace ShopEase.Domain.Features.CustomFields.Entities;

public class CustomField
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;

    /// <summary>"order" | "product" | "customer" | "category".</summary>
    public string Entity { get; set; } = string.Empty;

    /// <summary>"text" | "number" | "date" | "dropdown" | "checkbox".</summary>
    public string Type { get; set; } = string.Empty;

    public string OptionsJson { get; set; } = "[]";
    public bool Required { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
