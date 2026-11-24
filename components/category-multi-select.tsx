"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: string;
  name: string;
}

/**
 * Checkbox dropdown for picking several categories. Changes are staged while
 * the panel is open and committed once on close, so ticking five boxes
 * triggers one update instead of five. An empty selection means "all".
 */
export function CategoryMultiSelect({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: CategoryOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);

  const openPanel = () => {
    setDraft(value);
    setOpen(true);
  };

  // Refs keep the listeners below stable while still seeing the latest draft.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    const next = draftRef.current;
    const prev = valueRef.current;
    const changed = next.length !== prev.length || next.some((id) => !prev.includes(id));
    if (changed) onChangeRef.current(next);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) close(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const toggle = (categoryId: string) =>
    setDraft((current) => (current.includes(categoryId) ? current.filter((x) => x !== categoryId) : [...current, categoryId]));

  const shown = open ? draft : value;
  const summary =
    shown.length === 0
      ? "All categories"
      : shown.length === 1
        ? (options.find((option) => option.id === shown[0])?.name ?? "1 category")
        : `${shown.length} categories`;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close(false) : openPanel())}
        className="flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-rule bg-paper px-3.5 py-2 text-left text-base text-fg transition-colors duration-150 focus-visible:border-brass-strong focus-visible:outline-offset-0 sm:text-sm"
      >
        <span className={cn("truncate", shown.length === 0 && "text-fg-muted")}>{summary}</span>
        <ChevronDown aria-hidden="true" className={cn("h-4 w-4 shrink-0 text-fg-muted transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Categories"
          className="absolute inset-x-0 top-full z-dropdown mt-1 min-w-[16rem] rounded-md border border-rule bg-paper text-fg shadow-hover"
        >
          <div className="flex items-center justify-between gap-2 border-b border-rule px-2 py-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(options.map((option) => option.id))}>
              Select all
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setDraft([])} disabled={draft.length === 0}>
              Clear
            </Button>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {options.map((option) => (
              <li key={option.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm hover:bg-canvas">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-brass"
                    checked={draft.includes(option.id)}
                    onChange={() => toggle(option.id)}
                  />
                  <span className="min-w-0 break-words">{option.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
