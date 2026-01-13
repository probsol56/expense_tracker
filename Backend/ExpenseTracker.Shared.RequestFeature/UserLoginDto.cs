using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Shared.RequestFeature
{
    public record UserLoginDto
    {
        [Required(ErrorMessage = "Username is required")]
        public string? UserName { get; init; }

        [Required(ErrorMessage = "Password is required")]
        public string? Password { get; init; }
    }
}
