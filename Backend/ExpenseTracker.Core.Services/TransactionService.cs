using AutoMapper;
using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Core.Domain.Repositories;
using ExpenseTracker.Core.Services.Abstractions;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services
{
    public class TransactionService(IRepositoryManager repository, IMapper mapper) : ITransactionService
    {
        private readonly IRepositoryManager _repository = repository;
        private readonly IMapper _mapper = mapper;

        public async Task<IEnumerable<Transaction>> GetTransactionsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var transactions = await _repository.Transaction.GetTransactionsAsync(userId, trackChanges: false);
            return transactions;
        }
        public async Task<Transaction> CreateTransactionAsync(Guid userId, TransactionForCreationDto transactionDto, CancellationToken cancellationToken = default)
        {
            var transaction = new Transaction
            {
                Amount = transactionDto.Amount,
                Date = transactionDto.Date,
                Description = transactionDto.Description,
                CategoryId = transactionDto.CategoryId,
                UserId = userId,
                Attachments = []
            };

            // Handle File Uploads (Simplified for now)
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
                            await file.CopyToAsync(stream, cancellationToken);
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

            _repository.Transaction.Create(transaction);
            await _repository.SaveAsync();
            return transaction;
        }

        public async Task<bool> DeleteTransactionAsync(Guid userId, Guid id, bool trackChanges, CancellationToken cancellationToken = default)
        {
            var transaction = await _repository.Transaction.GetTransactionByIdAsync(userId, id, trackChanges);
            if (transaction is null)
                return false;

            _repository.Transaction.Delete(transaction);
            await _repository.SaveAsync();
            return true;
        }

        public async Task<Transaction?> GetTransactionByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
        {
            return await _repository.Transaction.GetTransactionByIdAsync(userId, id, trackChanges: false);
        }


        public async Task<Transaction?> UpdateTransactionAsync(Guid userId, Guid id, TransactionForCreationDto transactionDto, CancellationToken cancellationToken = default)
        {
            var transaction = await _repository.Transaction.GetTransactionByIdAsync(userId, id, trackChanges: true);
            if (transaction is null)
                return null;

            // Manual Map updates
            transaction.Amount = transactionDto.Amount;
            transaction.Date = transactionDto.Date;
            transaction.Description = transactionDto.Description;
            transaction.CategoryId = transactionDto.CategoryId;

            // Attachments update is complex, skipping for now as not requested.

            _repository.Transaction.Update(transaction);
            await _repository.SaveAsync();

            return transaction;
        }
    }
}
