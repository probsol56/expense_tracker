"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { updateCategory } from "@/app/(app)/categories/actions";
import { Alert, Button, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/toast-provider";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
const FALLBACK_COLOR = "#64748b";

type CategoryEditDialogProps = {
  category: {
    id: string;
    name: string;
    color: string;
  };
  onClose: () => void;
};

export function CategoryEditDialog({
  category,
  onClose,
}: CategoryEditDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState(
    /^#[\da-f]{6}$/i.test(category.color) ? category.color : FALLBACK_COLOR
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const { showToast } = useToast();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        if (!pendingRef.current) onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable =
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleSave = (formData: FormData) => {
    setError(undefined);
    startTransition(async () => {
      const result = await updateCategory(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      showToast("Category updated.", "success");
      onClose();
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="fixed inset-0 z-overlay bg-cover/60 animate-in fade-in duration-150"
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-edit-title"
        tabIndex={-1}
        className="relative z-modal max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none rounded-t-lg border border-rule bg-paper p-6 shadow-2xl animate-in slide-in-from-bottom duration-150 focus:outline-none sm:rounded-lg sm:p-7 sm:zoom-in-95"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brass-strong">
              Edit category
            </span>
            <h2
              id="category-edit-title"
              className="font-display text-2xl font-medium text-fg"
            >
              {category.name}
            </h2>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Close edit category dialog"
            onClick={onClose}
            disabled={pending}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <form action={handleSave} className="space-y-4">
          <input type="hidden" name="category_id" value={category.id} />
          <Field label="Name" htmlFor={`category-name-${category.id}`}>
            <Input
              id={`category-name-${category.id}`}
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={category.name}
              data-autofocus
            />
          </Field>
          <Field label="Color" htmlFor={`category-color-${category.id}`}>
            <div className="flex items-center gap-3">
              <Input
                id={`category-color-${category.id}`}
                type="color"
                name="color"
                value={color}
                aria-label="Choose category color"
                className="h-11 w-14 cursor-pointer p-1"
                onChange={(event) => setColor(event.currentTarget.value)}
              />
              <output
                htmlFor={`category-color-${category.id}`}
                className="font-mono text-sm uppercase text-fg"
                aria-live="polite"
              >
                {color}
              </output>
            </div>
          </Field>
          {error && <Alert>{error}</Alert>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <SubmitButton
              variant="primary"
              disabled={pending}
              loadingText="Saving..."
            >
              Save changes
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
