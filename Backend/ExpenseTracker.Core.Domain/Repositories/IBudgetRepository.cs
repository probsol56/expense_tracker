using ExpenseTracker.Core.Domain.Entities;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface IBudgetRepository : IRepositoryBase<Budget>
    {
        Task<Budget?> GetBudgetByIdAsync(Guid userId, Guid id, bool trackChanges);
        Task<IEnumerable<Budget>> GetBudgetsAsync(Guid userId, bool trackChanges);
    }
}