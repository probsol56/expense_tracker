using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Shared.RequestFeature;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories
{
    internal sealed class CategoryRepository(RepositoryContext repositoryContext) : RepositoryBase<Category>(repositoryContext), ICategoryRepository
    {
        public async Task<Category?> GetByIdAsync(Guid categoryId, bool trackChanges, CancellationToken cancellationToken)
        {
            return await GetOne(c => c.Id == categoryId, trackChanges).SingleOrDefaultAsync(cancellationToken);
        }
    }

}
