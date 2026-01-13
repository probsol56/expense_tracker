using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Shared.RequestFeature
{
    public record TransactionForCreationDto
    {
        [Required(ErrorMessage = "Amount is required")]
        public decimal Amount { get; init; }

        [Required]
        public DateTimeOffset Date { get; init; }

        public string? Description { get; init; }

        [Required(ErrorMessage = "Category is required")]
        public Guid CategoryId { get; init; }

        public IEnumerable<IFormFile>? Attachments { get; init; }
    }
}
