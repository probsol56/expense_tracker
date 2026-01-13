using AutoMapper;
using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http; // For IFormFile

namespace ExpenseTracker.Core.Services
{
    public class TransactionService : ITransactionService
    {
        private readonly IRepositoryManager _repository;
        private readonly IMapper _mapper;
        // private readonly IWebHostEnvironment _environment; // To save files to wwwroot or local folder

        public TransactionService(IRepositoryManager repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<Transaction> CreateTransaction(Guid userId, TransactionForCreationDto transactionDto)
        {
            // Map DTO to Entity
            // Since we don't have mapping profile yet, manual or assume mapper works
            // Assuming strict manual mapping for now or partial

            // Note: Use AutoMapper in real mapping profile, simplified here
            var transaction = new Transaction
            {
                Amount = transactionDto.Amount,
                Date = transactionDto.Date,
                Description = transactionDto.Description,
                CategoryId = transactionDto.CategoryId,
                UserId = userId,
                Attachments = new List<TransactionAttachment>()
            };

            // Handle File Uploads
            if (transactionDto.Attachments != null)
            {
                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                foreach (var file in transactionDto.Attachments)
                {
                    if (file.Length > 0)
                    {
                        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                        var filePath = Path.Combine(uploadPath, fileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        transaction.Attachments.Add(new TransactionAttachment
                        {
                            FileName = file.FileName,
                            FilePath = filePath,
                            FileType = file.ContentType
                        });
                    }
                }
            }

            _repository.Transaction.CreateTransaction(transaction);
            await _repository.SaveAsync();
            return transaction;
        }

        public async Task DeleteTransaction(Guid userId, Guid id, bool trackChanges)
        {
            var transaction = await _repository.Transaction.GetTransactionByIdAsync(userId, id, trackChanges);
            if (transaction is null)
                throw new KeyNotFoundException($"Transaction with id: {id} not found");

            _repository.Transaction.DeleteTransaction(transaction);
            await _repository.SaveAsync();
        }

        public async Task<Transaction> GetTransactionById(Guid userId, Guid id, bool trackChanges)
        {
            var transaction = await _repository.Transaction.GetTransactionByIdAsync(userId, id, trackChanges);
            if (transaction is null)
                throw new KeyNotFoundException($"Transaction with id: {id} not found");
            return transaction;
        }

        public async Task<IEnumerable<Transaction>> GetTransactions(Guid userId, bool trackChanges)
        {
            return await _repository.Transaction.GetTransactionsAsync(userId, trackChanges);
        }
    }
}
