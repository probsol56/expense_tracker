import * as React from "react";
import { cn } from "@/lib/utils";

/** Native `<select>` for server-rendered forms; matches `Input` so forms stay visually uniform. */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full cursor-pointer rounded-md border border-rule bg-paper px-3 text-base text-fg transition-colors duration-150 focus-visible:border-brass-strong focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        className
      )}
      {...props}
    />
  )
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
