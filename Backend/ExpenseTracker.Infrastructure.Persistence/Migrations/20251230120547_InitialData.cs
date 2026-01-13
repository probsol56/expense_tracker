using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ExpenseTracker.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "CreatedDate", "Description", "IsGlobal", "Name", "Type", "UpdatedDate" },
                values: new object[,]
                {
                    { new Guid("3b39708c-9742-4e42-8c6e-771efacb40ed"), new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6650), new TimeSpan(0, 6, 0, 0, 0)), "Freelance Income", false, "Freelance", (short)1, null },
                    { new Guid("3ddf5524-7fda-4537-b596-0dad4e6a1867"), new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6681), new TimeSpan(0, 6, 0, 0, 0)), "Entertainment Expenses like  Events", true, "Entertainment", (short)2, null },
                    { new Guid("54dc7648-c68d-41c3-97d2-ca0885a9099f"), new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 474, DateTimeKind.Unspecified).AddTicks(5119), new TimeSpan(0, 6, 0, 0, 0)), "Monthly Salary", true, "Salary", (short)1, null },
                    { new Guid("d564877a-0765-4b9d-bc24-9d228ea267b1"), new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6677), new TimeSpan(0, 6, 0, 0, 0)), "Utility Bills like Electricity, Water, Internet", true, "Utilities", (short)2, null },
                    { new Guid("dabbec01-1df9-4d8a-bd6a-9d6fd0e44128"), new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6679), new TimeSpan(0, 6, 0, 0, 0)), "Transportation Expenses like Bus, Taxi, Fuel", true, "Transportation", (short)2, null },
                    { new Guid("e4df724c-7e92-40f8-be2c-622aa899298a"), new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6675), new TimeSpan(0, 6, 0, 0, 0)), "Monthly House Rent Payment", true, "House Rent", (short)2, null },
                    { new Guid("ecd4b597-5cd1-4b00-b2a0-ff059f6dec85"), new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6671), new TimeSpan(0, 6, 0, 0, 0)), "Food and Dining Expenses", true, "Food", (short)2, null },
                    { new Guid("f7129929-faa9-4b47-afd7-b07d6a88566f"), new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6691), new TimeSpan(0, 6, 0, 0, 0)), "Medical and Healthcare Expenses", true, "Healthcare", (short)2, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("3b39708c-9742-4e42-8c6e-771efacb40ed"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("3ddf5524-7fda-4537-b596-0dad4e6a1867"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("54dc7648-c68d-41c3-97d2-ca0885a9099f"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("d564877a-0765-4b9d-bc24-9d228ea267b1"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("dabbec01-1df9-4d8a-bd6a-9d6fd0e44128"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("e4df724c-7e92-40f8-be2c-622aa899298a"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("ecd4b597-5cd1-4b00-b2a0-ff059f6dec85"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("f7129929-faa9-4b47-afd7-b07d6a88566f"));
        }
    }
}
