using ExpenseTracker.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;

namespace ExpenseTracker.Infrastructure.Persistence.Configurations
{
    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            var seedCreated = new DateTimeOffset(2025, 12, 30, 18, 05, 47, TimeSpan.FromHours(6));

            builder.HasData(
                    new Category
                {
                    Id = Guid.Parse("54dc7648-c68d-41c3-97d2-ca0885a9099f"),
                    CreatedDate = seedCreated,
                    Name = "Salary",
                    Description = "Monthly Salary",
                    Type = 1,
                    IsGlobal = true
                },
                new Category
                {
                    Id = Guid.Parse("3b39708c-9742-4e42-8c6e-771efacb40ed"),
                    CreatedDate = seedCreated,
                    Name = "Freelance",
                    Description = "Freelance Income",
                    Type = 1,
                    IsGlobal = false
                },
                new Category
                {
                    Id = Guid.Parse("ecd4b597-5cd1-4b00-b2a0-ff059f6dec85"),
                    CreatedDate = seedCreated,
                    Name = "Food",
                    Description = "Food and Dining Expenses",
                    Type = 2,
                    IsGlobal = true
                },
                new Category
                {
                    Id = Guid.Parse("e4df724c-7e92-40f8-be2c-622aa899298a"),
                    CreatedDate = seedCreated,
                    Name = "House Rent",
                    Description = "Monthly House Rent Payment",
                    Type = 2,
                    IsGlobal = true
                },
                new Category
                {
                    Id = Guid.Parse("d564877a-0765-4b9d-bc24-9d228ea267b1"),
                    CreatedDate = seedCreated,
                    Name = "Utilities",
                    Description = "Utility Bills like Electricity, Water, Internet",
                    Type = 2,
                    IsGlobal = true
                },
                new Category
                {
                    Id = Guid.Parse("dabbec01-1df9-4d8a-bd6a-9d6fd0e44128"),
                    CreatedDate = seedCreated,
                    Name = "Transportation",
                    Description = "Transportation Expenses like Bus, Taxi, Fuel",
                    Type = 2,
                    IsGlobal = true
                },
                new Category
                {
                    Id = Guid.Parse("3ddf5524-7fda-4537-b596-0dad4e6a1867"),
                    CreatedDate = seedCreated,
                    Name = "Entertainment",
                    Description = "Entertainment Expenses like  Events",
                    Type = 2,
                    IsGlobal = true
                },
                new Category
                {
                    Id = Guid.Parse("f7129929-faa9-4b47-afd7-b07d6a88566f"),
                    CreatedDate = seedCreated,
                    Name = "Healthcare",
                    Description = "Medical and Healthcare Expenses",
                    Type = 2,
                    IsGlobal = true
                }
            );
        }
    }
}
