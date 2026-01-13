using System.ComponentModel.DataAnnotations.Schema;

namespace ExpenseTracker.Core.Domain.Entities
{
    public class TransactionAttachment : CommonEntity
    {
        public required string FileName { get; set; }
        public required string FilePath { get; set; }
        public required string FileType { get; set; }

        public Guid TransactionId { get; set; }
        [ForeignKey(nameof(TransactionId))]
        public Transaction? Transaction { get; set; }
    }
}
