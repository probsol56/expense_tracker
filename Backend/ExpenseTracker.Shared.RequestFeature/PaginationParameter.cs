using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ExpenseTracker.Shared.RequestFeature
{
    public class PaginationParameter
    {
        public int Page { get; set; } = 1;
        public int PerPage { get; set; } = 10;
        public string? Sort { get; set; } // e.g., "name,ASC"
        public string? Filter { get; set; } // JSON string
    }
}
