interface CategoryBadgeProps {
  name: string;
  color?: string;
}

export function CategoryBadge({ name, color }: CategoryBadgeProps) {
  const safeColor = color && /^#[\da-f]{6}$/i.test(color) ? color : undefined;

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-rule bg-paper px-2.5 py-1 text-sm text-fg">
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${safeColor ? "" : "bg-fg-muted"}`}
        style={safeColor ? { backgroundColor: safeColor } : undefined}
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
