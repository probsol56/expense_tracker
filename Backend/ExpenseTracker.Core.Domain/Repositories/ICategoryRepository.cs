using ExpenseTracker.Core.Domain.Entities;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface ICategoryRepository : IRepositoryBase<Category>
    {
        Task<Category?> GetByIdAsync(Guid categoryId, bool trackChanges, CancellationToken cancellationToken);
    }
}
