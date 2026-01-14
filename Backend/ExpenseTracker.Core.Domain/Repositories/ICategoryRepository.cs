using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface ICategoryRepository : IRepositoryBase<Category>
    {
        Task<IEnumerable<Category>> GetCategoriesAsync(Guid userId, PaginationParameter parameters, bool trackChanges);
        Task<Category?> GetCategoryByIdAsync(Guid userId, Guid id, bool trackChanges);
    }
}
