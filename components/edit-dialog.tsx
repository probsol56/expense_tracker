"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Alert } from "@/components/ui";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function EditDialog({
  title,
  closeHref,
  error,
  wide = false,
  children,
}: {
  title: string;
  closeHref: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => router.push(closeHref, { scroll: false }), [router, closeHref]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [close]);

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="fixed inset-0 z-overlay bg-cover/60 animate-in fade-in duration-200"
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
        tabIndex={-1}
        className={`relative z-modal max-h-[90vh] w-full ${wide ? "max-w-2xl" : "max-w-lg"} overflow-y-auto rounded-b-none rounded-t-lg border border-rule bg-paper p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 focus:outline-none sm:rounded-lg sm:p-7 sm:zoom-in-95`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brass-strong">Edit entry</span>
            <h2 id="edit-dialog-title" className="font-display text-2xl font-medium text-fg">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close dialog"
            className="-mr-2 grid h-11 w-11 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-rule/50 hover:text-fg"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {error && (
          <Alert className="mb-4">{error}</Alert>
        )}

        {children}
      </div>
    </div>
  );
}
