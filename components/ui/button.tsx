import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-fg text-paper hover:bg-fg/85",
        primary: "bg-brass text-cover hover:bg-brass/85",
        destructive: "bg-brick text-paper hover:bg-brick/85",
        outline: "border border-rule bg-paper text-fg hover:border-fg/30 hover:bg-canvas",
        secondary: "bg-rule/60 text-fg hover:bg-rule",
        ghost: "text-fg-muted hover:bg-rule/50 hover:text-fg",
        link: "text-brass-strong underline-offset-4 hover:underline",
      },
      // Every size keeps a 44px hit area on touch (§ touch targets); `sm` is for dense desktop rows.
      size: {
        default: "h-11 px-4",
        sm: "h-10 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
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

