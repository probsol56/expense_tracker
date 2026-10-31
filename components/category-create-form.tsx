"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { createCategory } from "@/app/(app)/categories/actions";
import { Alert, Button, Field, Input, NativeSelect } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CategoryCreateForm({ error }: { error?: string }) {
  const [isOpen, setIsOpen] = useState(Boolean(error));
  const [mounted, setMounted] = useState(false);
  const [color, setColor] = useState("#ef6f6c");
  const [pending, startTransition] = useTransition();
  const pendingRef = useRef(pending);
  const dialogRef = useRef<HTMLDivElement>(null);
  pendingRef.current = pending;

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        if (!pendingRef.current) close();
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
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [close, isOpen, mounted]);

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      await createCategory(formData);
      close();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="primary"
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        <Plus aria-hidden="true" />
        Add category
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              className="fixed inset-0 z-overlay bg-cover/60 animate-in fade-in duration-150"
              aria-hidden="true"
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-create-title"
              tabIndex={-1}
              className="relative z-modal max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none rounded-t-lg border border-rule bg-paper p-6 shadow-2xl animate-in slide-in-from-bottom duration-150 focus:outline-none sm:rounded-lg sm:p-7 sm:zoom-in-95"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-brass-strong">
                    Categories
                  </span>
                  <h2
                    id="category-create-title"
                    className="font-display text-2xl font-medium text-fg"
                  >
                    Add a category
                  </h2>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Close add category dialog"
                  onClick={close}
                  disabled={pending}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>

              <form action={handleCreate} className="space-y-4">
                <Field label="Name" htmlFor="category-name">
                  <Input
                    id="category-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="e.g. Salary or Groceries"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "category-error" : undefined}
                    data-autofocus
                  />
                </Field>
                <Field label="Type" htmlFor="category-type">
                  <NativeSelect
                    id="category-type"
                    name="type"
                    defaultValue="expense"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="loan">Loan</option>
                  </NativeSelect>
                </Field>
                <Field label="Color" htmlFor="category-color">
                  <div className="flex items-center gap-3">
                    <Input
                      id="category-color"
                      type="color"
                      name="color"
                      value={color}
                      aria-label="Choose category color"
                      className="h-11 w-14 cursor-pointer p-1"
                      onChange={(event) => setColor(event.currentTarget.value)}
                    />
                    <output
                      htmlFor="category-color"
                      className="font-mono text-sm uppercase text-fg"
                      aria-live="polite"
                    >
                      {color}
                    </output>
                  </div>
                </Field>
                {error && (
                  <div id="category-error">
                    <Alert>{error}</Alert>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={close}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                  <SubmitButton
                    variant="primary"
                    disabled={pending}
                    loadingText="Saving..."
                  >
                    Save category
                  </SubmitButton>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
