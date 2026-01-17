using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services.Abstractions
{
    public interface ICategoryService
    {
        Task<(IQueryable<Category> categories, int totalCount)> GetCategoriesAsync(
           Guid userId,
           PaginationParameter parameters,
           bool trackChanges,
           CancellationToken cancellationToken = default);

        Task<Category?> GetCategoryByIdAsync(Guid userId, Guid categoryId, bool trackChanges, CancellationToken cancellationToken = default);

        Task<Category> CreateCategoryAsync(Guid userId, CategoryDto categoryDto, bool trackChanges, CancellationToken cancellationToken = default);
        Task<Category?> UpdateCategoryAsync(Guid userId, Guid categoryId, CategoryDto categoryDto, bool trackChanges, CancellationToken cancellationToken = default);
        Task<bool> DeleteCategoryAsync(Guid userId, Guid categoryId, bool trackChanges, CancellationToken cancellationToken = default);
    }
}
