using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services.Abstractions;

public interface IBudgetSerice
{
    Task<BudgetDto> GetBudgetsAsync(Guid userId, PaginationParameter parameters, CancellationToken cancellationToken = default);
    Task<BudgetDto> GetBudgetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<BudgetDto> CreateBudgetAsync(Guid userId, BudgetDto budgetDto,bool trackChanges, CancellationToken cancellationToken = default);
    Task<BudgetDto> UpdateBudgetAsync(Guid userId, Guid id, BudgetDto budgetDto,bool trackChanges, CancellationToken cancellationToken = default);
    Task<BudgetDto> DeleteBudgetAsync(Guid userId, Guid id,bool trackChanges, CancellationToken cancellationToken = default);
}