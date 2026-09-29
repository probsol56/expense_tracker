import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A titled block of a page: Fraunces heading, optional lede and right-aligned action. */
export function Section({
  title,
  description,
  action,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-medium text-fg">{title}</h2>
          {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
