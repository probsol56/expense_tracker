using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface IRepositoryBase<T> where T : CommonEntity
    {
        IQueryable<T> GetList(PaginationParameter paginationParameter, bool trackChanges);
        Task<T?> GetByIdAsync(Guid id, bool trackChanges, CancellationToken cancellationToken);
        void Create(T entity);
        void Update(T entity);
        void Delete(T entity);
    }
}
