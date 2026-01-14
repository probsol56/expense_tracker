using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services.Abstractions
{
    public interface ITransactionService
    {
        Task<IEnumerable<Transaction>> GetTransactionsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<Transaction?> GetTransactionByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
        Task<Transaction> CreateTransactionAsync(Guid userId, TransactionForCreationDto transactionDto, CancellationToken cancellationToken = default);
        Task<Transaction?> UpdateTransactionAsync(Guid userId, Guid id, TransactionForCreationDto transactionDto, CancellationToken cancellationToken = default);
        Task<bool> DeleteTransactionAsync(Guid userId, Guid id, bool trackChanges, CancellationToken cancellationToken = default);
    }
}
