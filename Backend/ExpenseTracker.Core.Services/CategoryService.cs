using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;
using LoggingService;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Core.Services
{
    internal sealed class CategoryService(IRepositoryManager _repository, ILoggerManager _logger) : ICategoryService
    {
        public async Task<(IEnumerable<Category> categories, int totalCount)> GetListAsync(PaginationParameter parameters, bool trackChanges, CancellationToken cancellationToken = default)
        {
            var categoriesQuery = _repository.Category.GetList(parameters, trackChanges);
            var totalCount = await categoriesQuery.CountAsync(cancellationToken);
            var categories = await categoriesQuery.ToListAsync(cancellationToken);
            return (categories, totalCount);
        }

        public async Task<Category> CreateCategoryAsync(Category category, CancellationToken cancellationToken = default)
        {
            _repository.Category.Create(category);
            await _repository.SaveAsync();
            return category;
        }

        public async Task<bool> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default)
        {
            var category = await _repository.Category.GetByIdAsync(categoryId, trackChanges: false);
            if (category is null)
                return false;

            _repository.Category.Delete(category);
            await _repository.SaveAsync();
            return true;
        }

        public async Task<Category?> GetOneAsync(Guid categoryId, CancellationToken cancellationToken = default)
        {
            var category = await _repository.Category.GetOne(categoryId, trackChanges: false);
            return category;
        }

        public async Task<Category?> UpdateCategoryAsync(Guid categoryId, Category category, CancellationToken cancellationToken = default)
        {
            var existingCategory = await _repository.Category.GetByIdAsync(categoryId, trackChanges: true, cancellationToken);
            if (existingCategory is null)
                return null;

            existingCategory.Name = category.Name;
            existingCategory.Description = category.Description;
            existingCategory.Type = category.Type;
            existingCategory.IsGlobal = category.IsGlobal;

            _repository.Category.Update(existingCategory);
            await _repository.SaveAsync();

            return existingCategory;
        }
    }
}
