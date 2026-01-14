using ExpenseTracker.Core.Domain.Exceptions;
using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExpenseTracker.Infrastructure.Presentation.Extensions;

namespace ExpenseTracker.Infrastructure.Presentation.Controllers
{
    [Route("api/categories")]
    [ApiController]
    [Authorize]
    public class CategoriesController(IServiceManager serviceManager) : ControllerBase
    {
        public readonly IServiceManager _serviceManager = serviceManager;

        [HttpGet]
        public async Task<IActionResult> GetCategories([FromQuery] PaginationParameter parameters)
        {
            var userId = User.GetUserId();
            var (categories, totalCount) = await _serviceManager.CategoryService.GetCategoriesAsync(userId, parameters, cancellationToken: default);
            return Ok(new { categories, totalCount });
        }
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetCategoryById(Guid id)
        {
            var userId = User.GetUserId();
            var category = await _serviceManager.CategoryService.GetCategoryByIdAsync(userId, id);
            return category is null ? throw new CategoryNotFoundException(id) : Ok(category);
        }
    }
}
