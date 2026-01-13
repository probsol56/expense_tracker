using ExpenseTracker.Shared.RequestFeature;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface IRepositoryBase<T>
    {
        IQueryable<T> GetAll(PaginationParameter paginationParameter, bool trackChanges);
        IQueryable<T> FindByCondition(Expression<Func<T, bool>> expression, bool trackChanges);
        void Create(T entity);
        void Update(T entity);
        void Delete(T entity);
    }
}
