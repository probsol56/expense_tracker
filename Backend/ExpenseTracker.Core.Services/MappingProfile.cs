using AutoMapper;
using ExpenseTracker.Core.Domain.Entities;
using ExpenseTracker.Shared.RequestFeature;

namespace ExpenseTracker.Core.Services
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<UserRegistrationDto, User>();
            // Add other maps
            CreateMap<TransactionForCreationDto, Transaction>();
            
        }
    }
}
