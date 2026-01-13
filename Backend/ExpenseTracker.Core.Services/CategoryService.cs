using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;
using LoggingService;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ExpenseTracker.Core.Services
{
    internal sealed class CategoryService(IRepositoryManager _repository, ILoggerManager _logger) : ICategoryService
    {
        public async Task<(IEnumerable<Category> categories, int totalCount)> GetList(PaginationParameter parameters, bool trackChanges, CancellationToken cancellationToken = default)
        {
            var categoriesQuery = _repository.Category.GetAll(parameters, trackChanges);
            var totalCount = await categoriesQuery.CountAsync(cancellationToken);
            var categories = await categoriesQuery.ToListAsync(cancellationToken);
            return (categories, totalCount);
        }

        public Task<Category> CreateCategoryAsync(Category category, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        public async Task<Category?> GetOne(Guid categoryId, CancellationToken cancellationToken = default)
        {
            var category = await _repository.Category.GetByIdAsync(categoryId, trackChanges: false, cancellationToken);
            return category;
        }

        public Task<Category?> UpdateCategoryAsync(Guid categoryId, Category category, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
