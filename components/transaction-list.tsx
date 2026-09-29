"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { LoadingOverlay } from "@/components/ui";
import { TransactionListContent } from "@/components/transaction-list-content";
import { TransactionListFilters } from "@/components/transaction-list-filters";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { PaginationBar } from "@/components/pagination-bar";
import type { ActivityType } from "@/lib/dashboard";
import type { Account, Loan, Transaction } from "@/lib/types";
import { isLoanCategory, isTransferCategory } from "@/lib/utils";

interface TransactionListProps {
  /** Current page of filtered transactions (already paginated on the server). */
  transactions: Transaction[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    totalRows: number;
  };
  filterType: ActivityType;
  setFilterType: (type: ActivityType) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onAdd: () => void;
  currency?: string;
  /** True while a page/filter navigation is in flight. */
  isPending?: boolean;
  accounts: Account[];
  loans?: Loan[];
}

export function TransactionList({
  transactions,
  pagination,
  filterType,
  setFilterType,
  query,
  onQueryChange,
  onPageChange,
  onPageSizeChange,
  onAdd,
  currency = "BDT",
  isPending = false,
  accounts,
  loans = [],
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filtering, sorting and pagination all happen on the server (see
  // `components/dashboard.tsx`); the client only renders the page it receives.
  const handleEdit = (transaction: Transaction) => {
    if (isLoanCategory(transaction.category) || isTransferCategory(transaction.category)) return;
    setEditingTransaction(transaction);
  };

  return (
    <section className="min-w-0">
      <TransactionListFilters filterType={filterType} setFilterType={setFilterType} />

      <div className="relative overflow-hidden rounded-lg border border-rule bg-paper">
        <label className="flex items-center gap-3 border-b border-rule px-4 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-brass-strong">
          <Search size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
          <span className="sr-only">Search transactions</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Merchant, note or category"
            className="h-12 w-full bg-transparent text-base text-fg placeholder:text-fg-muted/80 focus-visible:outline-none"
          />
        </label>
        <TransactionListContent
          transactions={transactions}
          currency={currency}
          query={query}
          filterType={filterType}
          onEdit={handleEdit}
          onClearFilters={() => {
            onQueryChange("");
            setFilterType("all");
          }}
          onAdd={onAdd}
        />
        <LoadingOverlay show={isPending} className="bg-paper/70 dark:bg-paper/70" />
      </div>

      <PaginationBar
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        totalRows={pagination.totalRows}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        disabled={isPending}
      />

      {editingTransaction && (
        <AddTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          currency={currency}
          accounts={accounts}
          loans={loans}
        />
      )}
    </section>
  );
}
