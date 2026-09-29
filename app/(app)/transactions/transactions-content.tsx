"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Upload, X } from "lucide-react";
import { Button, Input, Label, LoadingOverlay, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { PageHeader } from "@/components/page-header";
import { TransactionsGrid } from "@/app/(app)/transactions/transactions-grid";
import { PaginationBar } from "@/components/pagination-bar";
import type { GroupByMode } from "@/app/(app)/transactions/transactions-grid";
import type { Account, Loan, Transaction } from "@/lib/types";
import { DEFAULT_CATEGORY_OPTIONS } from "@/lib/category-options";
import { isLoanCategory, isTransferCategory } from "@/lib/utils";

interface TransactionsPageContentProps {
  transactions: Transaction[];
  currency: string;
  workspaceName: string;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    totalRows: number;
  };
  filters: {
    category: string;
    dateFrom: string;
    dateTo: string;
    groupBy: GroupByMode;
  };
  accounts: Account[];
  loans: Loan[];
}

// Flatten all categories from all types for the filter dropdown
const ALL_CATEGORIES = [
  ...DEFAULT_CATEGORY_OPTIONS.expense,
  ...DEFAULT_CATEGORY_OPTIONS.income,
  ...DEFAULT_CATEGORY_OPTIONS.loan,
];

export function TransactionsPageContent({
  transactions,
  currency,
  workspaceName,
  pagination,
  filters,
  accounts,
  loans,
}: TransactionsPageContentProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Search-param-only navigations (pagination, filters) don't trigger the
  // route's loading.tsx Suspense boundary, so track pending state ourselves.
  const [isPending, startTransition] = useTransition();

  // All filtering & pagination live on the server (see `app/transactions/page.tsx`).
  // The client only mirrors the URL to keep inputs controlled and navigates on change.
  const { page, pageSize, totalPages, totalCount, totalRows } = pagination;
  const { category: filterCategory, dateFrom: filterDateFrom, dateTo: filterDateTo, groupBy } = filters;

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const query = next.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [router, searchParams, pathname],
  );

  const activeFilterCount = [
    filterCategory !== "all",
    !!filterDateFrom,
    !!filterDateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setParam({ category: undefined, dateFrom: undefined, dateTo: undefined, page: "1" });
  };

  // Loan disbursements/repayments are posted automatically from the Loans
  // page and keep a loan's outstanding balance in sync — editing them here
  // would desync that balance, so send people there instead. Transfers are
  // the same story, managed from the Accounts page.
  const handleEdit = (transaction: Transaction) => {
    if (isLoanCategory(transaction.category) || isTransferCategory(transaction.category)) return;
    setEditingTransaction(transaction);
  };

  const recordCount = `${totalCount}${totalRows !== totalCount ? ` of ${totalRows}` : ""} ${totalRows === 1 ? "entry" : "entries"}`;

  return (
    <div className="mx-auto max-w-5xl">
        <PageHeader eyebrow={`${workspaceName} · ${recordCount}`} title="Transactions">
          <Button variant="outline" asChild>
            <Link href="/import">
              <Upload size={16} aria-hidden="true" />
              Import statement
            </Link>
          </Button>
          <Button variant="primary" onClick={() => setShowAddTransaction(true)}>
            <Plus size={16} aria-hidden="true" />
            Add transaction
          </Button>
        </PageHeader>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="filter-category" className="text-xs uppercase tracking-widest text-fg-muted">Category</Label>
            <Select value={filterCategory} onValueChange={(v) => setParam({ category: v === "all" ? undefined : v, page: "1" })}>
              <SelectTrigger id="filter-category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="filter-from" className="text-xs uppercase tracking-widest text-fg-muted">From</Label>
            <Input
              id="filter-from"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setParam({ dateFrom: e.target.value, page: "1" })}
              max={filterDateTo || undefined}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="filter-to" className="text-xs uppercase tracking-widest text-fg-muted">To</Label>
            <Input
              id="filter-to"
              type="date"
              value={filterDateTo}
              onChange={(e) => setParam({ dateTo: e.target.value, page: "1" })}
              min={filterDateFrom || undefined}
            />
          </div>

          <div className="flex items-end">
            {activeFilterCount > 0 && (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                <X size={15} aria-hidden="true" />
                Clear {activeFilterCount === 1 ? "filter" : `${activeFilterCount} filters`}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-medium text-fg">Entries</h2>
          <div role="group" aria-label="Group entries by" className="flex items-center gap-1">
            <span className="mr-1 text-sm text-fg-muted">Group by</span>
            {(["none", "category", "date"] as const).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={groupBy === g}
                onClick={() => setParam({ groupBy: g })}
                className={`min-h-11 border-b-2 px-2 text-sm capitalize transition-colors duration-150 ${
                  groupBy === g ? "border-brass font-semibold text-fg" : "border-transparent text-fg-muted hover:text-fg"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-rule bg-paper">
          <TransactionsGrid
            transactions={transactions}
            currency={currency}
            groupBy={groupBy}
            isFiltered={activeFilterCount > 0}
            onEdit={handleEdit}
            onAdd={() => setShowAddTransaction(true)}
            onClearFilters={clearFilters}
          />
          <LoadingOverlay show={isPending} />
        </div>

        {/* ── Pagination bar (server-driven via URL params) ── */}
        <PaginationBar
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalCount}
          totalRows={totalRows}
          onPageChange={(p) => setParam({ page: String(p) })}
          onPageSizeChange={(size) => setParam({ pageSize: String(size), page: "1" })}
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

        {showAddTransaction && (
          <AddTransactionModal onClose={() => setShowAddTransaction(false)} currency={currency} accounts={accounts} loans={loans} />
        )}
    </div>
  );
}
