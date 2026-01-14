namespace ExpenseTracker.Shared.RequestFeature
{
    public record DashboardStatsDto(
        decimal TotalBudget,
        decimal MonthlyIncome,
        decimal MonthlyExpense,
        decimal MonthlyBalance
    );
}
