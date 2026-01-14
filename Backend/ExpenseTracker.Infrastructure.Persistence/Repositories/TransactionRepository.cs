using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories
{
    public class TransactionRepository(RepositoryContext repositoryContext) : RepositoryBase<Transaction>(repositoryContext), ITransactionRepository
    {
        public async Task<Transaction?> GetTransactionByIdAsync(Guid userId, Guid id, bool trackChanges) =>
            await GetOne(t => t.UserId == userId && t.Id == id, trackChanges)
                .Include(t => t.Attachments)
                .SingleOrDefaultAsync();

        public async Task<IEnumerable<Transaction>> GetTransactionsAsync(Guid userId, bool trackChanges) =>
            await GetOne(t => t.UserId == userId, trackChanges)
                .Include(t => t.Category)
                .ToListAsync();



    }
}
