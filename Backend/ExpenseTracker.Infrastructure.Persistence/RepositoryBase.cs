using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Shared.RequestFeature;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace ExpenseTracker.Infrastructure.Persistence
{
    public abstract class RepositoryBase<T>(RepositoryContext repositoryContext) : IRepositoryBase<T> where T : class
    {
        protected RepositoryContext RepositoryContext = repositoryContext;

        protected IQueryable<T> GetAll(bool trackChanges) =>
            !trackChanges ?
            RepositoryContext.Set<T>().AsNoTracking() :
            RepositoryContext.Set<T>();


        public IQueryable<T> GetAll(PaginationParameter paginationParameter, bool trackChanges)
        {
            IQueryable<T> query = GetAll(trackChanges);
            if (paginationParameter.Page <= 0)
            {
                return query;
            }
            var skip = (paginationParameter.Page - 1) * paginationParameter.PerPage;
            return query.Skip(skip).Take(paginationParameter.PerPage);
        }

        public IQueryable<T> FindByCondition(Expression<Func<T, bool>> expression, bool trackChanges)
        {
            return !trackChanges ?
                RepositoryContext.Set<T>().Where(expression).AsNoTracking() :
                RepositoryContext.Set<T>().Where(expression);
        }

        public void Create(T entity) => RepositoryContext.Set<T>().Add(entity);
        public void Update(T entity) => RepositoryContext.Set<T>().Update(entity);
        public void Delete(T entity) => RepositoryContext.Set<T>().Remove(entity);




    }

}
