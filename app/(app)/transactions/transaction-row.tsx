"use client";

import { Edit } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icon";
import { money } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface TransactionRowProps {
  transaction: Transaction;
  currency: string;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionRow({
  transaction,
  currency,
  onEdit,
}: TransactionRowProps) {
  const isPositive = Number(transaction.amount) > 0;
  const { icon: CategoryIcon, bg } = getCategoryIcon(transaction.category);

  return (
    <div className="group flex items-center justify-between gap-3.5 p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-ink-900/60 transition-colors">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 shadow-sm transition-transform group-hover:scale-105 ${bg}`}
        >
          <CategoryIcon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
            {transaction.merchant}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {transaction.notes ? (
              <>
                <span className="truncate text-[11px] font-medium text-slate-500">
                  {transaction.notes}
                </span>
                <span className="text-slate-300">·</span>
              </>
            ) : null}
            <span className="truncate text-xs font-medium text-slate-500">
              {transaction.category}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">
              {transaction.date}
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`text-sm sm:text-base font-extrabold tabular-nums tracking-tight ${
            isPositive ? "text-teal-600 dark:text-teal-400" : "text-slate-900 dark:text-slate-100"
          }`}
        >
          {isPositive ? "+" : ""}
          {money(Number(transaction.amount), currency)}
        </p>
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {transaction.status || "settled"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onEdit(transaction)}
        className="shrink-0 ml-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:hover:bg-ink-800 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100"
        aria-label="Edit transaction"
      >
        <Edit size={16} />
      </button>
    </div>
  );
}
