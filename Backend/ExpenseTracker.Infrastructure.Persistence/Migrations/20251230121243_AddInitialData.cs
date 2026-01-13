using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpenseTracker.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInitialData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("3b39708c-9742-4e42-8c6e-771efacb40ed"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 0, DateTimeKind.Unspecified), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("3ddf5524-7fda-4537-b596-0dad4e6a1867"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 0, DateTimeKind.Unspecified), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("54dc7648-c68d-41c3-97d2-ca0885a9099f"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 0, DateTimeKind.Unspecified), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("d564877a-0765-4b9d-bc24-9d228ea267b1"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 0, DateTimeKind.Unspecified), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("dabbec01-1df9-4d8a-bd6a-9d6fd0e44128"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 0, DateTimeKind.Unspecified), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("e4df724c-7e92-40f8-be2c-622aa899298a"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 0, DateTimeKind.Unspecified), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("ecd4b597-5cd1-4b00-b2a0-ff059f6dec85"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 0, DateTimeKind.Unspecified), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("f7129929-faa9-4b47-afd7-b07d6a88566f"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 0, DateTimeKind.Unspecified), new TimeSpan(0, 6, 0, 0, 0)));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("3b39708c-9742-4e42-8c6e-771efacb40ed"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6650), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("3ddf5524-7fda-4537-b596-0dad4e6a1867"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6681), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("54dc7648-c68d-41c3-97d2-ca0885a9099f"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 474, DateTimeKind.Unspecified).AddTicks(5119), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("d564877a-0765-4b9d-bc24-9d228ea267b1"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6677), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("dabbec01-1df9-4d8a-bd6a-9d6fd0e44128"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6679), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("e4df724c-7e92-40f8-be2c-622aa899298a"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6675), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("ecd4b597-5cd1-4b00-b2a0-ff059f6dec85"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6671), new TimeSpan(0, 6, 0, 0, 0)));

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("f7129929-faa9-4b47-afd7-b07d6a88566f"),
                column: "CreatedDate",
                value: new DateTimeOffset(new DateTime(2025, 12, 30, 18, 5, 47, 476, DateTimeKind.Unspecified).AddTicks(6691), new TimeSpan(0, 6, 0, 0, 0)));
        }
    }
}
