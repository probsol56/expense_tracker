using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTracker.Core.Domain.Entities
{
    public class Transaction : CommonEntity
    {
        public decimal Amount { get; set; }
        public DateTimeOffset Date { get; set; }
        public string? Description { get; set; }

        public Guid UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public Guid CategoryId { get; set; }
        [ForeignKey(nameof(CategoryId))]
        public Category? Category { get; set; }

        public ICollection<TransactionAttachment>? Attachments { get; set; }
    }
}
