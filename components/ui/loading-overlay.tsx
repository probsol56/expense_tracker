"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingOverlayProps {
  show: boolean;
  className?: string;
}

/** Absolute-positioned spinner overlay for a `relative` container mid-fetch. */
export function LoadingOverlay({ show, className }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-[1px] dark:bg-ink-950/60",
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-400" />
    </div>
  );
}
