using ExpenseTracker.Core.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ExpenseTracker.Infrastructure.Persistence
{
    public sealed class RepositoryManager : IRepositoryManager
    {
        public readonly RepositoryContext _repositoryContext;
        public Lazy<ICategoryRepository> _categoryRepository;
        public Lazy<ITransactionRepository> _transactionRepository;

        public RepositoryManager(RepositoryContext repositoryContext)
        {
            _repositoryContext = repositoryContext;
            _categoryRepository = new Lazy<ICategoryRepository>(() => new Repositories.CategoryRepository(_repositoryContext));
            _transactionRepository = new Lazy<ITransactionRepository>(() => new Repositories.TransactionRepository(_repositoryContext));
        }

        public ICategoryRepository Category => _categoryRepository.Value;
        public ITransactionRepository Transaction => _transactionRepository.Value;
        public void Save() => _repositoryContext.SaveChanges();
        public async Task SaveAsync() => await _repositoryContext.SaveChangesAsync();
    }
}
