using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services.Abstractions
{
    public interface ITransactionService
    {
        Task<Transaction> CreateTransaction(Guid userId, TransactionForCreationDto transactionDto);
        Task<IEnumerable<Transaction>> GetTransactions(Guid userId, bool trackChanges);
        Task<Transaction> GetTransactionById(Guid userId, Guid id, bool trackChanges);
        Task DeleteTransaction(Guid userId, Guid id, bool trackChanges);
    }
}
