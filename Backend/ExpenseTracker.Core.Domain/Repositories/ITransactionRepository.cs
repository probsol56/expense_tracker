using ExpenseTracker.Core.Domain.Entities;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface ITransactionRepository : IRepositoryBase<Transaction>
    {
        Task<Transaction?> GetTransactionByIdAsync(Guid userId, Guid id, bool trackChanges);
        Task<IEnumerable<Transaction>> GetTransactionsAsync(Guid userId, bool trackChanges);
    }
}
