"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

export interface PaginationBarProps {
  /** Current page (1-based). */
  page: number;
  /** Number of items shown per page. */
  pageSize: number;
  /** Total number of pages (after filtering). */
  totalPages: number;
  /** Total number of items after filtering. */
  totalCount: number;
  /** Total number of items before filtering (optional, shown alongside totalCount). */
  totalRows?: number;
  /** Page size options offered to the user. */
  pageSizeOptions?: number[];
  /** Whether to show the "Rows per page" selector. */
  showPageSize?: boolean;
  /** Disables all controls, e.g. while a page navigation is in flight. */
  disabled?: boolean;
  onPageChange: (page: number) => void;
  /** Omit for fixed-size lists; the "Rows per page" selector is then hidden. */
  onPageSizeChange?: (size: number) => void;
}

export function PaginationBar({
  page,
  pageSize,
  totalPages,
  totalCount,
  totalRows,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSize = true,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  if (totalCount === 0) return null;

  const safePage = Math.min(Math.max(1, page), totalPages);
  const rangeStart = (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalCount);

  // Build the list of page numbers to show, keeping first/last and a window
  // around the current page, collapsing the rest into "…" ellipsis markers.
  const pills: (number | "…")[] = [];
  Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
    )
    .reduce<(number | "…")[]>((acc, p, idx) => {
      if (idx > 0 && p - (acc[acc.length - 1] as number) > 1) {
        acc.push("…");
      }
      acc.push(p);
      return acc;
    }, pills);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg-muted">
            Rows per page
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
            disabled={disabled}
          >
            <SelectTrigger className="h-10 w-20 border-rule bg-paper text-sm text-fg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm tabular-nums text-fg-muted">
          {rangeStart}–{rangeEnd} of {totalCount}
          {totalRows !== undefined && totalRows !== totalCount &&
            ` of ${totalRows} records`}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-rule bg-paper text-fg-muted transition-colors duration-150 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page pills */}
          <div className="flex items-center gap-1">
            {pills.map((p, i) =>
              p === "…" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-sm text-fg-muted"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPageChange(p as number)}
                  className={`h-10 min-w-10 rounded-lg px-2 text-sm font-medium tabular-nums transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                    p === safePage
                      ? "bg-fg font-semibold text-paper"
                      : "border border-rule bg-paper text-fg hover:bg-rule/30"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            disabled={disabled || safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-rule bg-paper text-fg-muted transition-colors duration-150 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
