"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button, Card, Input, LoadingOverlay } from "@/components/ui";
import { Search } from "lucide-react";
import { TransactionListContent } from "@/components/transaction-list-content";
import { TransactionListFilters } from "@/components/transaction-list-filters";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { PaginationBar } from "@/components/pagination-bar";
import type { ActivityType } from "@/components/dashboard";
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
  currency = "BDT",
  isPending = false,
  accounts,
  loans = [],
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Filtering, sorting and pagination all happen on the server (see
  // `components/dashboard.tsx`); the client only renders the page it receives.
  const handleEdit = (transaction: Transaction) => {
    if (isLoanCategory(transaction.category) || isTransferCategory(transaction.category)) return;
    setEditingTransaction(transaction);
  };

  return (
    <section>
      <TransactionListFilters
        filterType={filterType}
        setFilterType={setFilterType}
        onAdd={() => setShowAdd(true)}
      />
      <Card className="relative overflow-hidden shadow-card">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-ink-900/60 px-4 py-3">
          <Search size={16} className="shrink-0 text-slate-400" />
          <Input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Search transactions by merchant, note, or category..." className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-slate-400" />
        </div>
        <TransactionListContent transactions={transactions} currency={currency} query={query} filterType={filterType} onEdit={handleEdit} onClearFilters={() => { onQueryChange(""); setFilterType("all"); }} />
        <LoadingOverlay show={isPending} />
      </Card>
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
      {editingTransaction && <AddTransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} currency={currency} accounts={accounts} loans={loans} />}
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} currency={currency} accounts={accounts} loans={loans} />}
    </section>
  );
}
