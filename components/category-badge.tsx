import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color?: string;
  className?: string;
}

export function CategoryBadge({ name, color, className }: CategoryBadgeProps) {
  const safeColor = color && /^#[\da-f]{6}$/i.test(color) ? color : undefined;

  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-rule bg-paper px-2.5 py-1 text-sm text-fg",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${safeColor ? "" : "bg-fg-muted"}`}
        style={safeColor ? { backgroundColor: safeColor } : undefined}
      />
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}
