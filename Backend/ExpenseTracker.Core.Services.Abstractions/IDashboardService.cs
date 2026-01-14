using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services.Abstractions
{
    public interface IDashboardService
    {
        Task<DashboardStatsDto> GetStatsAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}
