import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui";

/** Loading placeholder matching `PageHeader` (and optionally `FigureStrip`) so the layout doesn't jump on arrival. */
export function PageSkeleton({
  label,
  width = "max-w-5xl",
  figures = false,
  children,
}: {
  label: string;
  width?: string;
  figures?: boolean;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-label={label} className={`mx-auto ${width}`}>
      <div className="mb-8">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-10 w-64 max-w-full" />
      </div>
      {figures && (
        <div className="mb-10 grid gap-6 border-b-[3px] border-double border-rule pb-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-9 w-36" />
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
