using ExpenseTracker.Shared.RequestFeature;
using Microsoft.AspNetCore.Identity;

namespace ExpenseTracker.Core.Services.Abstractions
{
    public interface IAuthenticationService
    {
        Task<IdentityResult> RegisterUser(UserRegistrationDto userForRegistration);
        Task<bool> ValidateUser(UserLoginDto userForAuth);
        Task<string> CreateToken();
    }
}
