using System.Security.Claims;

namespace ExpenseTracker.Infrastructure.Presentation.Extensions
{
    public static class UserClaimsExtensions
    {
        public static Guid GetUserId(this ClaimsPrincipal user)
        {
            var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(id, out var userId) ? userId : Guid.Empty;
        }
    }
}
