import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
        primary:
          "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-sm hover:from-teal-700 hover:to-teal-600 hover:shadow-glow hover:-translate-y-0.5",
        destructive:
          "bg-coral text-white shadow-sm hover:bg-coral-600 hover:shadow-glow-coral hover:-translate-y-0.5",
        outline:
          "border border-slate-200/90 bg-white/80 backdrop-blur-sm text-slate-800 hover:border-slate-300 hover:bg-slate-50/80 hover:text-slate-900 shadow-sm dark:border-slate-700 dark:bg-ink-800/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-ink-800 dark:hover:text-slate-100 dark:shadow-none",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200/90 shadow-sm dark:bg-ink-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:shadow-none",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-ink-800 dark:hover:text-slate-100",
        link:
          "text-teal-600 underline-offset-4 hover:underline hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-4 text-xs font-medium",
        lg: "h-11 rounded-xl px-6 text-base",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? (loadingText ?? children) : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

