using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTracker.Core.Domain.Entities
{
    public class Category : CommonEntity
    {

        [Required(ErrorMessage = "Category name is a required.")]
        public required string Name { get; set; }
        public string? Description { get; set; }
        public short Type { get; set; } // 1 = Income, 2 = Expense
        public bool IsGlobal { get; set; }

        public Guid? UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }
    }
}
