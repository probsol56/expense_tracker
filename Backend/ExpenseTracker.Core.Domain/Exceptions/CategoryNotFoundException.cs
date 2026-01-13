namespace ExpenseTracker.Core.Domain.Exceptions;
public class CategoryNotFoundException(Guid categoryId) : NotFoundException($"Category with id: {categoryId} not found")
{
}