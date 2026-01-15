using System.ComponentModel.DataAnnotations;

public record CategoryDto
{
    [Required(ErrorMessage = "Name is required")]
    public string? Name { get; init; }
    public string? Description { get; init; }
    [Required(ErrorMessage = "Type is required")]
    public short? Type { get; init; }
}