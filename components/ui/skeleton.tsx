import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative isolate overflow-hidden rounded-xl bg-slate-200/80 dark:bg-ink-800",
        "before:absolute before:inset-0 before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent dark:before:via-white/10",
        className
      )}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
