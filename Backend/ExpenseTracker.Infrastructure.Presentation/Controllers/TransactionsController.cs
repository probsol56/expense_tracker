using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Infrastructure.Presentation.Extensions;

namespace ExpenseTracker.Infrastructure.Presentation.Controllers
{
    [Route("api/transactions")]
    [ApiController]
    [Authorize]
    public class TransactionsController(IServiceManager service) : ControllerBase
    {
        private readonly IServiceManager _service = service;

        [HttpGet]
        public async Task<IActionResult> GetTransactions()
        {
            var userId = User.GetUserId();
            var transactions = await _service.TransactionService.GetTransactionsAsync(userId, cancellationToken: default);
            return Ok(transactions);
        }

        [HttpGet("{id:guid}", Name = "TransactionById")]
        public async Task<IActionResult> GetTransaction(Guid id)
        {
            var userId = User.GetUserId();
            var transaction = await _service.TransactionService.GetTransactionByIdAsync(userId, id, cancellationToken: default);
            return Ok(transaction);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] TransactionForCreationDto transactionDto)
        {
            var userId = User.GetUserId();
            var transaction = await _service.TransactionService.CreateTransactionAsync(userId, transactionDto, cancellationToken: default);

            return CreatedAtRoute("TransactionById", new { id = transaction.Id }, transaction);
        }
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] TransactionForCreationDto transactionDto)
        {
            var userId = User.GetUserId();
            var transaction = await _service.TransactionService.UpdateTransactionAsync(userId, id, transactionDto, cancellationToken: default);
            return Ok(transaction);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteTransaction(Guid id)
        {
            var userId = User.GetUserId();
            await _service.TransactionService.DeleteTransactionAsync(userId, id, trackChanges: false, cancellationToken: default);
            return NoContent();
        }
    }
}
