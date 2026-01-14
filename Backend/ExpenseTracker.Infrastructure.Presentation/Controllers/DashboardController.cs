using ExpenseTracker.Core.Services.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ExpenseTracker.Infrastructure.Presentation.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    [Authorize]
    public class DashboardController(IServiceManager service) : ControllerBase
    {
        private readonly IServiceManager _service = service;

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var stats = await _service.DashboardService.GetStatsAsync(Guid.Parse(userId));
            return Ok(stats);
        }
    }
}
