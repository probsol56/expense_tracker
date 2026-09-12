"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";

interface TransactionListFiltersProps {
  filterType: "all" | "expenses" | "income" | "loan";
  setFilterType: (type: "all" | "expenses" | "income" | "loan") => void;
  onAdd?: () => void;
}

export function TransactionListFilters({
  filterType,
  setFilterType,
  onAdd,
}: TransactionListFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Recent activity
        </h2>
        <p className="text-xs text-slate-500">Real-time ledger updates</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl bg-slate-100/80 dark:bg-ink-800/80 p-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          {(["all", "expenses", "income", "loan"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filterType === f}
              onClick={() => setFilterType(f)}
              className={`rounded-lg px-3 py-1 transition-all ${
                filterType === f
                  ? "bg-white text-slate-900 shadow-sm dark:bg-ink-950 dark:text-slate-100"
                  : "hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {onAdd && (
          <Button
            type="button"
            size="sm"
            onClick={onAdd}
            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Plus size={14} />
            Add
          </Button>
        )}
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="text-teal-700 hover:text-teal-800 hover:bg-teal-50 font-semibold">
            View all <ArrowUpRight size={14} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
