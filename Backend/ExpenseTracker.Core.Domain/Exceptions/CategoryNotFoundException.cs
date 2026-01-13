namespace ExpenseTracker.Core.Domain.Exceptions;
public class CategoryNotFoundException : NotFoundException
{
    public CategoryNotFoundException(Guid categoryId) : base($"Category with id: {categoryId} not found")
    {
    }
}