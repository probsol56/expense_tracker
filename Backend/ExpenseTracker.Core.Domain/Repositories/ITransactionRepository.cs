using ExpenseTracker.Core.Domain.Entities;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface ITransactionRepository
    {
        void CreateTransaction(Transaction transaction);
        Task<IEnumerable<Transaction>> GetTransactionsAsync(Guid userId, bool trackChanges);
        Task<Transaction?> GetTransactionByIdAsync(Guid userId, Guid id, bool trackChanges);
        void DeleteTransaction(Transaction transaction);
    }
}
