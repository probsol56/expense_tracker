using AutoMapper;
using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Core.Services.Abstractions;
using LoggingService;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace ExpenseTracker.Core.Services
{
    public sealed class ServiceManager(IRepositoryManager repositoryManager, ILoggerManager loggerManager, UserManager<User> userManager, IConfiguration configuration, IMapper mapper) : IServiceManager
    {
        private readonly Lazy<ICategoryService> _categoryService = new(() => new CategoryService(repositoryManager, loggerManager));
        private readonly Lazy<IAuthenticationService> _authenticationService = new(() => new AuthenticationService(userManager, configuration, mapper, repositoryManager));
        private readonly Lazy<ITransactionService> _transactionService = new(() => new TransactionService(repositoryManager, mapper));

        public ICategoryService CategoryService => _categoryService.Value;
        public IAuthenticationService AuthenticationService => _authenticationService.Value;
        public ITransactionService TransactionService => _transactionService.Value;
    }
}
