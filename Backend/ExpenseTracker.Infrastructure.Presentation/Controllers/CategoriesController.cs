using ExpenseTracker.Core.Domain.Exceptions;
using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Infrastructure.Presentation.Controllers
{
    [Route("api/categories")]
    [ApiController]
    public class CategoriesController(IServiceManager serviceManager) : ControllerBase
    {
        public readonly IServiceManager _serviceManager = serviceManager;

        [HttpGet]
        public async Task<IActionResult> GetCategories([FromQuery] PaginationParameter parameters)
        {
            var (categories, totalCount) = await _serviceManager.CategoryService.GetList(parameters, trackChanges: false);
            return Ok(new { categories, totalCount });
        }
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetCategoryById(Guid id)
        {
            var category = await _serviceManager.CategoryService.GetOne(id);
            return category is null ? throw new CategoryNotFoundException(id) : Ok(category);
        }
    }
}
