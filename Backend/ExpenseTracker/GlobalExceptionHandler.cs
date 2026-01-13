using ExpenseTracker.Core.Domain.Exceptions;
using LoggingService;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace ExpenseTracker
{
    public class GlobalExceptionHandler(ILoggerManager logger, IProblemDetailsService problemDetailsService) : IExceptionHandler
    {
        private readonly ILoggerManager _logger = logger;
        private readonly IProblemDetailsService _problemDetailsService = problemDetailsService;

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception
            exception, CancellationToken cancellationToken = default)
        {
            httpContext.Response.ContentType = "application/json";
            httpContext.Response.StatusCode = exception switch
            {
                NotFoundException => StatusCodes.Status404NotFound,
                _ => StatusCodes.Status500InternalServerError
            };
            _logger.LogError($"Something went wrong: {exception.Message}");
            var result = await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = httpContext,
                ProblemDetails = {
                    Title = "An error occurred",
                    Status = httpContext.Response.StatusCode,
                    Detail = exception.Message,
                    Type = exception.GetType().Name
                },
                Exception = exception
            });
            if (!result)
                await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Title = "An error occurred",
                    Status = httpContext.Response.StatusCode,
                    Detail = exception.Message,
                    Type = exception.GetType().Name
                }, cancellationToken);
            return true;
        }
    }
}
