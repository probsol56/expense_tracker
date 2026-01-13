namespace ExpenseTracker.Core.Domain.Exceptions;
public abstract class NotFoundException(string message) : Exception(message)
{
}