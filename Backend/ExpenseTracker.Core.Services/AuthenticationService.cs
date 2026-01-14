using AutoMapper;
using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ExpenseTracker.Core.Services
{
    public class AuthenticationService(UserManager<User> userManager, IConfiguration configuration, IMapper mapper, IRepositoryManager repository) : IAuthenticationService
    {
        private readonly UserManager<User> _userManager = userManager;
        private readonly IConfiguration _configuration = configuration;
        private readonly IMapper _mapper = mapper;
        private readonly IRepositoryManager _repository = repository;
        private User? _user;

        public async Task<IdentityResult> RegisterUser(UserRegistrationDto userForRegistration)
        {
            var user = _mapper.Map<User>(userForRegistration);
            var result = await _userManager.CreateAsync(user, userForRegistration.Password!);

            if (result.Succeeded)
            {
                if (userForRegistration.Roles != null)
                {
                    await _userManager.AddToRolesAsync(user, userForRegistration.Roles);
                }

                // Assign Default Categories
                var globalCategories = await _repository.Category.GetGlobalCategoriesAsync(trackChanges: false);
                foreach (var globalCat in globalCategories)
                {
                    var newCat = new Category
                    {
                        Name = globalCat.Name,
                        Description = globalCat.Description,
                        Type = globalCat.Type,
                        IsGlobal = false, // User's copy is private
                        UserId = user.Id
                    };
                    _repository.Category.Create(newCat);
                }
                await _repository.SaveAsync();
            }

            return result;
        }

        public async Task<bool> ValidateUser(UserLoginDto userForAuth)
        {
            _user = await _userManager.FindByNameAsync(userForAuth.UserName!);
            return _user != null && await _userManager.CheckPasswordAsync(_user, userForAuth.Password!);
        }

        public async Task<string> CreateToken()
        {
            var secretKey = _configuration["JwtSettings:SecretKey"];
            // Fallback for demo/dev if config is missing (SHOULD be in appsettings)
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey ?? "SuperSecretKeyForExpenseTrackerAndDemoWaitWhatIsThis123456"));

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, _user!.Id.ToString()),
                new(ClaimTypes.Name, _user.UserName!)
            };

            // Add roles
            var roles = await _userManager.GetRolesAsync(_user);
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenOptions = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:ValidIssuer"],
                audience: _configuration["JwtSettings:ValidAudience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpiresInMinutes"] ?? "60")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(tokenOptions);
        }
    }
}
