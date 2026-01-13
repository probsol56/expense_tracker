using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories
{
    internal sealed class CategoryRepository(RepositoryContext repositoryContext) : RepositoryBase<Category>(repositoryContext), ICategoryRepository
    {

        public IQueryable<Category> GetList(bool trackChanges)
        {
            return GetAll(trackChanges).OrderBy(c => c.Name);
        }
        public async Task<Category?> GetByIdAsync(Guid categoryId, bool trackChanges, CancellationToken cancellationToken)
        {
            return await FindByCondition(c => c.Id == categoryId, trackChanges).SingleOrDefaultAsync(cancellationToken);
        }
    }

}
