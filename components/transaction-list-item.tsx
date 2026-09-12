"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icon";
import { isLoanCategory, money } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface TransactionListItemProps {
  transaction: Transaction;
  currency: string;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionListItem({
  transaction,
  currency,
  onEdit,
}: TransactionListItemProps) {
  const isPositive = Number(transaction.amount) > 0;
  const isLoanEntry = isLoanCategory(transaction.category);
  const { icon: CategoryIcon, bg } = getCategoryIcon(transaction.category);

  return (
    <div className="group flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50/80 transition-colors">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 shadow-sm transition-transform group-hover:scale-105 ${bg} dark:ring-1 dark:bg-opacity-10`}>
        <CategoryIcon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        {isLoanEntry ? (
          <Link
            href="/loans"
            className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-amber-700 dark:text-slate-100 dark:hover:text-amber-400"
          >
            {transaction.merchant}
          </Link>
        ) : (
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
            {transaction.merchant}
          </p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {transaction.notes && (
            <>
              <span className="truncate text-[11px] font-medium text-slate-500">
                {transaction.notes}
              </span>
              <span className="text-slate-300">·</span>
            </>
          )}
          <span className="truncate text-xs font-medium text-slate-500">
            {transaction.category}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-400">
            {transaction.date}
          </span>
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

      {!isLoanEntry && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(transaction);
          }}
          className="shrink-0 ml-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:hover:bg-ink-800 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100"
          aria-label="Edit transaction"
        >
          <Edit size={16} />
        </button>
      )}
    </div>
  );
}
