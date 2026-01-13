using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ExpenseTracker.Infrastructure.Presentation.Controllers
{
    [Route("api/transactions")]
    [ApiController]
    [Authorize]
    public class TransactionsController : ControllerBase
    {
        private readonly IServiceManager _service;

        public TransactionsController(IServiceManager service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var transactions = await _service.TransactionService.GetTransactions(userId, trackChanges: false);
            return Ok(transactions);
        }

        [HttpGet("{id:guid}", Name = "TransactionById")]
        public async Task<IActionResult> GetTransaction(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var transaction = await _service.TransactionService.GetTransactionById(userId, id, trackChanges: false);
            return Ok(transaction);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromForm] TransactionForCreationDto transactionDto)
        {
            if (transactionDto is null)
                return BadRequest("TransactionDto object is null");

            if (!ModelState.IsValid)
                return UnprocessableEntity(ModelState);

            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var transaction = await _service.TransactionService.CreateTransaction(userId, transactionDto);

            return CreatedAtRoute("TransactionById", new { id = transaction.Id }, transaction);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteTransaction(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            await _service.TransactionService.DeleteTransaction(userId, id, trackChanges: false);
            return NoContent();
        }
    }
}
