"use client";

import { Label, NativeSelect } from "@/components/ui";
import type { TransactionSortOrder } from "@/lib/transaction-sort";

interface TransactionSortSelectProps {
  id: string;
  sortOrder: TransactionSortOrder;
  onSortOrderChange: (sortOrder: TransactionSortOrder) => void;
  compact?: boolean;
}

export function TransactionSortSelect({
  id,
  sortOrder,
  onSortOrderChange,
  compact = false,
}: TransactionSortSelectProps) {
  return (
    <div className={compact ? "flex items-center gap-2" : "flex min-w-32 flex-col gap-1.5"}>
      <Label
        htmlFor={id}
        className={compact ? "sr-only" : "text-xs uppercase tracking-widest text-fg-muted"}
      >
        Sort order
      </Label>
      <NativeSelect
        id={id}
        value={sortOrder}
        className={compact ? "h-10 w-auto min-w-32 px-2.5" : undefined}
        onChange={(event) => onSortOrderChange(event.target.value === "asc" ? "asc" : "desc")}
      >
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </NativeSelect>
    </div>
  );
}
