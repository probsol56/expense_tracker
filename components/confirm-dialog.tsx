"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

const FOCUSABLE_SELECTOR = "button:not([disabled])";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    // Capture phase on window so a parent dialog's own Escape/Tab handlers
    // (registered on document) never see keys meant for this one.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (!pending) onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      event.stopPropagation();
      event.stopImmediatePropagation();
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      previouslyFocused?.focus();
    };
  }, [open, pending, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-popover flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-cover/60 animate-in fade-in duration-150"
        onClick={pending ? undefined : onCancel}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative w-full max-w-sm rounded-lg border border-rule bg-paper p-6 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brick/10 text-brick">
            <AlertTriangle size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 id="confirm-dialog-title" className="font-display text-xl font-medium text-fg">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-1 text-sm text-fg-muted">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending} data-autofocus>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
