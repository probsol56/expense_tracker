using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Infrastructure.Persistence.Configurations;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Persistence
{
    public class RepositoryContext(DbContextOptions options) : IdentityDbContext<User, IdentityRole<Guid>, Guid>(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder); // Required for Identity configurations
            modelBuilder.ApplyConfiguration(new CategoryConfiguration());
            modelBuilder.ApplyConfiguration(new UserConfiguration());
            modelBuilder.ApplyConfiguration(new TransactionConfiguration());
            modelBuilder.ApplyConfiguration(new TransactionAttachmentConfiguration());
            modelBuilder.ApplyConfiguration(new BudgetConfiguration());
        }
        public DbSet<Category>? Categories { get; set; }
        public DbSet<Transaction>? Transactions { get; set; }
        public DbSet<TransactionAttachment>? TransactionAttachments { get; set; }
        public DbSet<Budget>? Budgets { get; set; }
    }
}
