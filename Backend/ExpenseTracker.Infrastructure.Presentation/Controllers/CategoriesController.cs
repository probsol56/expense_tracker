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
        [HttpGet("{id:guid}", Name = "GetCategoryById")]
        public async Task<IActionResult> GetCategoryById(Guid id)
        {
            var userId = User.GetUserId();
            var category = await _serviceManager.CategoryService.GetCategoryByIdAsync(userId, id);
            return category is null ? throw new CategoryNotFoundException(id) : Ok(category);
        }
        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryDto categoryDto)
        {
            var userId = User.GetUserId();
            var category = await _serviceManager.CategoryService.CreateCategoryAsync(userId, categoryDto, trackChanges: false, cancellationToken: default);
            return CreatedAtRoute("GetCategoryById", new { id = category.Id }, category);
        }
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] CategoryDto categoryDto)
        {
            var userId = User.GetUserId();
            var category = await _serviceManager.CategoryService.UpdateCategoryAsync(userId, id, categoryDto, trackChanges: true, cancellationToken: default);
            return Ok(category);
        }
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            var userId = User.GetUserId();
            await _serviceManager.CategoryService.DeleteCategoryAsync(userId, id, trackChanges: false, cancellationToken: default);
            return NoContent();
        }
    }
}
