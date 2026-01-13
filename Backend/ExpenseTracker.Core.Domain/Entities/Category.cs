using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Core.Domain.Entities
{
    public class Category: CommonEntity
    {

        [Required(ErrorMessage = "Category name is a required.")]
        public required string Name { get; set; }
        public string? Description { get; set; }
        public Int16 Type { get; set; } // 1 = Income, 2 = Expense
        public bool IsGlobal { get; set; }  
    }
}
