"use client";

import Link from "next/link";
import { LedgerTable } from "@/components/ledger-table";
import { TransactionListItem } from "@/components/transaction-list-item";
import type { Transaction } from "@/lib/types";

interface TransactionListContentProps {
  transactions: Transaction[];
  currency: string;
  query: string;
  filterType: "all" | "expenses" | "income" | "loan" | "transfer";
  onEdit: (transaction: Transaction) => void;
  onClearFilters: () => void;
  onAdd: () => void;
}

export function TransactionListContent({
  transactions,
  currency,
  query,
  filterType,
  onEdit,
  onClearFilters,
  onAdd,
}: TransactionListContentProps) {
  if (transactions.length) {
    return (
      <LedgerTable caption="This month's transactions">
        <tbody>
          {transactions.map((transaction) => (
            <TransactionListItem
              key={transaction.id}
              transaction={transaction}
              currency={currency}
              onEdit={onEdit}
            />
          ))}
        </tbody>
      </LedgerTable>
    );
  }

  const isFiltered = Boolean(query) || filterType !== "all";

  return (
    <div className="px-6 py-12 text-center">
      <p className="font-display text-xl font-medium text-fg">
        {isFiltered ? "No entries match these filters" : "Nothing recorded this month"}
      </p>
      <p className="mx-auto mt-2 max-w-prose text-sm text-fg-muted">
        {isFiltered
          ? "Other entries exist. Change or clear the filters to see them."
          : "Record an expense or income and it will appear here. Earlier months are under Transactions."}
      </p>
      {isFiltered ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 min-h-11 rounded-lg px-4 text-sm font-semibold text-brass-strong underline underline-offset-4 hover:text-fg"
        >
          Clear filters
        </button>
      ) : (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onAdd}
            className="min-h-11 rounded-lg bg-brass px-5 text-sm font-semibold text-cover transition-colors duration-150 hover:bg-brass/90"
          >
            Add transaction
          </button>
          <Link href="/import" className="text-sm font-semibold text-brass-strong underline underline-offset-4 hover:text-fg">
            Import a statement
          </Link>
          <Link href="/transactions" className="text-sm font-semibold text-brass-strong underline underline-offset-4 hover:text-fg">
            View all transactions
          </Link>
        </div>
      )}
    </div>
  );
}
