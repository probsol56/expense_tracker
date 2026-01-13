namespace ExpenseTracker.Core.Domain.Entities
{
    public class CommonEntity
    {
        public Guid Id { get; set; }
        public DateTimeOffset CreatedDate {  get; set; }= DateTimeOffset.Now;
        public DateTimeOffset? UpdatedDate { get; set; }
    }
}
