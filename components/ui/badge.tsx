import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-ink-800 dark:text-slate-200 dark:hover:bg-slate-700",
        outline: "border border-slate-200/80 bg-white text-slate-700 dark:border-slate-700 dark:bg-ink-800/70 dark:text-slate-200",
        teal: "bg-teal-50 text-teal-700 border border-teal-200/60 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800",
        mint: "bg-mint text-teal-800 border border-mint-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800",
        coral: "bg-coral-50 text-coral-600 border border-coral-200/60 dark:bg-coral-500/10 dark:text-rose-400 dark:border-rose-500/30",
        amber: "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
        indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30",
        purple: "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30",
        emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
        sky: "bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.25 text-[11px]",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
