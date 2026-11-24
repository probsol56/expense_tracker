import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const TABLE_ROWS = 6;

/**
 * Placeholder shaped like a report page (header, summary cards, table rows), so
 * the layout doesn't jump when the real report arrives. Decorative only — the
 * caller owns the loading announcement.
 */
export function ReportPageSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex justify-center overflow-hidden bg-canvas p-4 sm:p-8", className)}>
      <div className="flex w-full max-w-3xl flex-col gap-6 rounded-md bg-paper p-6 shadow-sm sm:p-10">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-7" />
          {Array.from({ length: TABLE_ROWS }, (_, row) => (
            <Skeleton key={row} className="h-4 opacity-70" />
          ))}
        </div>
      </div>
    </div>
  );
}
