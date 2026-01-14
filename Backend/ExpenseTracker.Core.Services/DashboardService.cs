using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services
{
    internal sealed class DashboardService(IRepositoryManager repository) : IDashboardService
    {
        private readonly IRepositoryManager _repository = repository;

        public async Task<DashboardStatsDto> GetStatsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            // 1. Fetch Transactions for the current month
            // Note: Since Repo returns all, we filter in memory. Optimized approach would be filtering in Repo, 
            // but for "Personal" scale (e.g., < 10k transactions), in-memory is acceptable for now.
            var allTransactions = await _repository.Transaction.GetTransactionsAsync(userId, trackChanges: false);

            var now = DateTimeOffset.Now;
            var currentMonthTransactions = allTransactions
                .Where(t => t.Date.Month == now.Month && t.Date.Year == now.Year)
                .ToList();

            decimal income = 0;
            decimal expense = 0;

            foreach (var t in currentMonthTransactions)
            {
                if (t.Category?.Type == 1) // 1 = Income
                    income += t.Amount;
                else if (t.Category?.Type == 2) // 2 = Expense
                    expense += t.Amount;
            }

            // 2. Fetch Budget (Mocked for now as Budget Repo isn't fully set up with data)
            // Implementation: We will define "Budget" as Sum of all Budget entities for this year (if any)
            // For now, return 0 or a placeholder until Budget CRUD is live.
            decimal totalBudget = 0;
            // var budgets = await _repository.Budget.GetBudgetsAsync... 

            return new DashboardStatsDto(
                TotalBudget: totalBudget,
                MonthlyIncome: income,
                MonthlyExpense: expense,
                MonthlyBalance: income - expense
            );
        }
    }
}
