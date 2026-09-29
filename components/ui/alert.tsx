import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONE_CLASS = {
  error: "border-brick/30 bg-brick/10 font-medium text-brick",
  warning: "border-brass/40 bg-brass/10 text-fg",
  info: "border-rule bg-canvas text-fg",
} as const;

/** Inline message block; errors are announced to assistive tech via `role="alert"`. */
export function Alert({
  tone = "error",
  className,
  children,
}: {
  tone?: keyof typeof TONE_CLASS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md border px-4 py-3 text-sm", TONE_CLASS[tone], className)}
    >
      {children}
    </div>
  );
}
