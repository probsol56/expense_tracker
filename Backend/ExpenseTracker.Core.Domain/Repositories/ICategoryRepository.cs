using ExpenseTracker.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface ICategoryRepository : IRepositoryBase<Category>
    {
        IQueryable<Category> GetList(bool trackChanges);
        Task<Category?> GetByIdAsync(Guid categoryId, bool trackChanges, CancellationToken cancellationToken);
    }
}
