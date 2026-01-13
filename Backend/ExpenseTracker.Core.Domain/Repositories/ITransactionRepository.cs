using ExpenseTracker.Core.Domain.Entities;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface ITransactionRepository : IRepositoryBase<Transaction>
    {
        Task<Transaction?> GetByIdAsync(Guid id, bool trackChanges);
    }
}
