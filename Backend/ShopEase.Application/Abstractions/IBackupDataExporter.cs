using ShopEase.Application.Common;

namespace ShopEase.Application.Abstractions;

public interface IBackupDataExporter
{
    /// <summary>Entities that can be exported (read-only, always safe).</summary>
    IReadOnlyList<string> AvailableEntities { get; }

    /// <summary>
    /// Entities that can also be restored (written back). Deliberately a subset of AvailableEntities —
    /// Users/Orders/Payments have cross-entity FK chains (Address, OrderItem) that make a blind
    /// bulk-replace risky, so restore is only offered for entities with no such dependencies.
    /// </summary>
    IReadOnlyList<string> RestorableEntities { get; }

    Task<Dictionary<string, object>> ExportAsync(IEnumerable<string> entityNames);
    Task<int> CountAsync(string entityName);
    Task<Result> RestoreAsync(string entityName, System.Text.Json.JsonElement data);

    /// <summary>Wipes every table DemoDataSeeder owns (plus their dependents) and reseeds from scratch.</summary>
    Task ResetAllAsync();
}
