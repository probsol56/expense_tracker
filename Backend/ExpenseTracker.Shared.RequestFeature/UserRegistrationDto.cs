using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Shared.RequestFeature
{
    public record UserRegistrationDto
    {
        [Required(ErrorMessage = "First name is required")]
        public string? FirstName { get; init; }

        [Required(ErrorMessage = "Last name is required")]
        public string? LastName { get; init; }

        [Required(ErrorMessage = "Username is required")]
        public string? UserName { get; init; }

        [Required(ErrorMessage = "Password is required")]
        public string? Password { get; init; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress]
        public string? Email { get; init; }

        public string? PhoneNumber { get; init; }
        public ICollection<string>? Roles { get; init; }
    }
}
