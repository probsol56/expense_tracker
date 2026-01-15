using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services.Abstractions
{
    public interface ICategoryService
    {
        Task<(IEnumerable<Category> categories, int totalCount)> GetCategoriesAsync(
           Guid userId,
           PaginationParameter parameters,
           CancellationToken cancellationToken = default);

        Task<Category?> GetCategoryByIdAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken = default);

        Task<Category> CreateCategoryAsync(Guid userId, CategoryDto categoryDto, CancellationToken cancellationToken = default);
        Task<Category?> UpdateCategoryAsync(Guid userId, Guid categoryId, CategoryDto categoryDto, CancellationToken cancellationToken = default);
        Task<bool> DeleteCategoryAsync(Guid userId, Guid categoryId, CancellationToken cancellationToken = default);
    }
}
