"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Filter, Plus, Upload, X } from "lucide-react";
import { Button, Card, Input, LoadingOverlay, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { TransactionsGrid } from "@/app/(app)/transactions/transactions-grid";
import { PaginationBar } from "@/components/pagination-bar";
import type { GroupByMode } from "@/app/(app)/transactions/transactions-grid";
import type { Account, Loan, Transaction } from "@/lib/types";
import { DEFAULT_CATEGORY_OPTIONS } from "@/lib/category-options";
import { isLoanCategory } from "@/lib/utils";

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
  // would desync that balance, so send people there instead.
  const handleEdit = (transaction: Transaction) => {
    if (isLoanCategory(transaction.category)) return;
    setEditingTransaction(transaction);
  };

  return (
    <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/70 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:border-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                {workspaceName}
              </span>
              <span className="text-xs text-slate-400">
                · {totalCount}
                {totalRows !== totalCount && ` of ${totalRows}`} records
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Transactions Ledger
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Full chronological transaction history across all connected accounts.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              onClick={() => setShowAddTransaction(true)}
              className="w-full justify-center bg-slate-900 text-white shadow-card hover:bg-slate-800 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:w-auto"
            >
              <Plus size={15} className="mr-1.5 inline" />
              Add transaction
            </Button>
            <Link href="/import" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full justify-center sm:w-auto">
                <Upload size={15} className="mr-2 inline" /> Import CSV
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-ink-900/60 sm:flex-row sm:items-end">
          {/* Filter icon + label */}
          <div className="flex items-center gap-1.5 self-center text-xs font-semibold text-slate-500 dark:text-slate-400 sm:self-auto">
            <Filter size={13} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </div>

          {/* Category */}
          <div className="flex flex-1 flex-col gap-1 min-w-0">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Category
            </label>
                        <Select value={filterCategory} onValueChange={(v) => setParam({ category: v === "all" ? undefined : v, page: "1" })}>
              <SelectTrigger className="h-9 text-sm">
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

          {/* Date From */}
          <div className="flex flex-1 flex-col gap-1 min-w-0">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              From
            </label>
            <div className="relative">
              <CalendarDays size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={filterDateFrom}
                                onChange={(e) => setParam({ dateFrom: e.target.value, page: "1" })}
                max={filterDateTo || undefined}
                className="h-9 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Date To */}
          <div className="flex flex-1 flex-col gap-1 min-w-0">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              To
            </label>
            <div className="relative">
              <CalendarDays size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={filterDateTo}
                                onChange={(e) => setParam({ dateTo: e.target.value, page: "1" })}
                min={filterDateFrom || undefined}
                className="h-9 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 shrink-0 gap-1.5 self-end text-xs text-slate-500 hover:text-rose-600"
            >
              <X size={13} />
              Clear
            </Button>
          )}
          {/* Group by */}
          <div className="flex flex-col gap-1 shrink-0">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Group by
            </label>
            <div className="flex items-center rounded-xl bg-slate-100/80 dark:bg-ink-800/80 p-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {(["none", "category", "date"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={groupBy === g}
                                    onClick={() => setParam({ groupBy: g })}
                  className={`rounded-lg px-3 py-1 transition-all ${
                    groupBy === g
                      ? "bg-white text-slate-900 shadow-sm dark:bg-ink-950 dark:text-slate-100"
                      : "hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {g === "none" ? "None" : g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="relative overflow-hidden shadow-card">
          <TransactionsGrid
            transactions={transactions}
            currency={currency}
            groupBy={groupBy}
            onEdit={handleEdit}
            onAdd={() => setShowAddTransaction(true)}
          />
          <LoadingOverlay show={isPending} />
        </Card>

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
