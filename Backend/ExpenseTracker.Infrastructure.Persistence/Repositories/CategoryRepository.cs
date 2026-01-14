using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Shared.RequestFeature;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence.Repositories
{
    internal sealed class CategoryRepository(RepositoryContext repositoryContext) : RepositoryBase<Category>(repositoryContext), ICategoryRepository
    {
        public async Task<IEnumerable<Category>> GetCategoriesAsync(Guid userId, PaginationParameter parameters, bool trackChanges)
        {
            var categories = await GetOne(c => c.UserId == userId || c.IsGlobal, trackChanges)
                .OrderBy(c => c.Name)
                .Skip((parameters.Page - 1) * parameters.PerPage)
                .Take(parameters.PerPage)
                .ToListAsync();

            return categories;
        }

        public async Task<Category?> GetCategoryByIdAsync(Guid userId, Guid id, bool trackChanges)
        {
            return await GetOne(c => (c.UserId == userId || c.IsGlobal) && c.Id == id, trackChanges).SingleOrDefaultAsync();
        }
    }
}
