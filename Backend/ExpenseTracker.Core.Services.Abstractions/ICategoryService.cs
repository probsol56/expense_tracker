using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services.Abstractions
{
    public interface ICategoryService
    {
        Task<(IEnumerable<Category> categories, int totalCount)> GetListAsync(
           PaginationParameter parameters,
           bool trackChanges = true,
           CancellationToken cancellationToken = default);
        Task<Category?> GetOneAsync(Guid categoryId, CancellationToken cancellationToken = default);
        Task<Category> CreateCategoryAsync(Category category, CancellationToken cancellationToken = default);
        Task<Category?> UpdateCategoryAsync(Guid categoryId, Category category, CancellationToken cancellationToken = default);
        Task<bool> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    }
}
