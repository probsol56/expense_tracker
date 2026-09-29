"use client";

import Link from "next/link";
import type { ActivityType } from "@/lib/dashboard";

interface TransactionListFiltersProps {
  filterType: ActivityType;
  setFilterType: (type: ActivityType) => void;
}

const FILTERS: { value: ActivityType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "expenses", label: "Expenses" },
  { value: "income", label: "Income" },
  { value: "loan", label: "Loans" },
  { value: "transfer", label: "Transfers" },
];

export function TransactionListFilters({ filterType, setFilterType }: TransactionListFiltersProps) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-medium text-fg">Recent activity</h2>
        <Link
          href="/transactions"
          className="text-sm font-semibold text-brass-strong underline-offset-4 hover:underline sm:hidden"
        >
          View all
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div role="group" aria-label="Filter by type" className="-mx-1 flex overflow-x-auto">
          {FILTERS.map(({ value, label }) => {
            const isSelected = filterType === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setFilterType(value)}
                className={`min-h-11 shrink-0 border-b-2 px-2 text-sm transition-colors duration-150 ${
                  isSelected
                    ? "border-brass font-semibold text-fg"
                    : "border-transparent text-fg-muted hover:text-fg"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <Link
          href="/transactions"
          className="hidden shrink-0 text-sm font-semibold text-brass-strong underline-offset-4 hover:underline sm:inline"
        >
          View all
        </Link>
      </div>
    </div>
  );
}
