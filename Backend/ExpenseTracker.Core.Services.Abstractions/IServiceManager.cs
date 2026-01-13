using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ExpenseTracker.Core.Services.Abstractions
{
    public interface IServiceManager
    {
        ICategoryService CategoryService { get; }
        IAuthenticationService AuthenticationService { get; }
        ITransactionService TransactionService { get; }
    }
}
