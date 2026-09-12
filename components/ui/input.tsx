import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-all duration-150 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-950 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-ink-800/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:ring-offset-ink-950",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

