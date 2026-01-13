using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ExpenseTracker.Core.Domain.Repositories
{
    public interface IRepositoryManager
    {
        ICategoryRepository Category { get; }
        ITransactionRepository Transaction { get; }
        void Save();
        Task SaveAsync();
    }
}
