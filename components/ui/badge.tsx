import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-fg text-paper",
        secondary: "border-transparent bg-rule/60 text-fg",
        outline: "border-rule text-fg-muted",
        positive: "border-moss/30 bg-moss/10 text-moss",
        negative: "border-brick/30 bg-brick/10 text-brick",
        warning: "border-brass/40 bg-brass/10 text-brass-strong",
      },
      size: {
        default: "text-xs",
        sm: "px-1.5 py-0 text-[11px]",
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
