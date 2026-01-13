using ExpenseTracker.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpenseTracker.Infrastructure.Persistence.Configurations
{
    public class TransactionAttachmentConfiguration : IEntityTypeConfiguration<TransactionAttachment>
    {
        public void Configure(EntityTypeBuilder<TransactionAttachment> builder)
        {
            builder.HasOne(ta => ta.Transaction)
                   .WithMany(t => t.Attachments)
                   .HasForeignKey(ta => ta.TransactionId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
