import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-rule bg-paper px-3.5 py-2 text-base text-fg transition-colors duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fg placeholder:text-fg-muted focus-visible:border-brass-strong focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-brick sm:text-sm",
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

