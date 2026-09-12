"use client";

import { Receipt } from "lucide-react";
import { TransactionListItem } from "@/components/transaction-list-item";
import type { Transaction } from "@/lib/types";

interface TransactionListContentProps {
  transactions: Transaction[];
  currency: string;
  query: string;
  filterType: "all" | "expenses" | "income" | "loan";
  onEdit: (transaction: Transaction) => void;
  onClearFilters: () => void;
}

export function TransactionListContent({
  transactions,
  currency,
  query,
  filterType,
  onEdit,
  onClearFilters,
}: TransactionListContentProps) {
  if (transactions.length) {
    return (
      <div className="divide-y divide-slate-100/80">
        {transactions.map((transaction) => (
          <TransactionListItem
            key={transaction.id}
            transaction={transaction}
            currency={currency}
            onEdit={onEdit}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="py-12 px-4 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-ink-800">
        <Receipt size={22} />
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {query || filterType !== "all"
          ? "No transactions match the current filters"
          : "No transactions recorded"}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {query || filterType !== "all"
          ? "Your ledger has records, but none match this filter."
          : "Add your first transaction to populate your financial ledger."}
      </p>
      {(query || filterType !== "all") && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-4"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
