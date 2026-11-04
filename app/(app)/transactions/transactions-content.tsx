"use client";

import type { TransactionTotals } from "@/lib/transactions";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Upload, X } from "lucide-react";
import { Button, Input, Label, LoadingOverlay } from "@/components/ui";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { CategoryBadge } from "@/components/category-badge";
import { PageHeader } from "@/components/page-header";
import { TransactionsGrid } from "@/app/(app)/transactions/transactions-grid";
import { PaginationBar } from "@/components/pagination-bar";
import { TransactionSortSelect } from "@/components/transaction-sort-select";
import type { GroupByMode } from "@/app/(app)/transactions/transactions-grid";
import type { Account, Loan, Transaction } from "@/lib/types";
import type { TransactionSortOrder } from "@/lib/transaction-sort";
import { isLoanCategory, isTransferCategory } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks";

interface TransactionsPageContentProps {
  transactions: Transaction[];
  rangeTotals?: TransactionTotals;
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
    sortOrder: TransactionSortOrder;
    groupBy: GroupByMode;
  };
  accounts: Account[];
  loans: Loan[];
  categories: string[];
  categoryColors: Record<string, string>;
}

export function TransactionsPageContent({
  transactions,
  rangeTotals,
  currency,
  workspaceName,
  pagination,
  filters,
  accounts,
  loans,
  categories,
  categoryColors,
}: TransactionsPageContentProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [categoryInput, setCategoryInput] = useState(filters.category === "all" ? "" : filters.category);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [dateFrom, setDateFrom] = useState(filters.dateFrom);
  const [dateTo, setDateTo] = useState(filters.dateTo);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Search-param-only navigations (pagination, filters) don't trigger the
  // route's loading.tsx Suspense boundary, so track pending state ourselves.
  const [isPending, startTransition] = useTransition();

  // All filtering & pagination live on the server (see `app/transactions/page.tsx`).
  // The client only mirrors the URL to keep inputs controlled and navigates on change.
  const { page, pageSize, totalPages, totalCount, totalRows } = pagination;
  const { category: filterCategory, dateFrom: filterDateFrom, dateTo: filterDateTo, sortOrder, groupBy } = filters;
  const debouncedDateFrom = useDebounce(dateFrom);
  const debouncedDateTo = useDebounce(dateTo);
  const previousDateFilters = useRef({ dateFrom: filterDateFrom, dateTo: filterDateTo });
  const lastSubmittedDateFilters = useRef({ dateFrom: filterDateFrom, dateTo: filterDateTo });

  useEffect(() => {
    setCategoryInput(filterCategory === "all" ? "" : filterCategory);
  }, [filterCategory]);

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

  useEffect(() => {
    const previous = previousDateFilters.current;
    if (filterDateFrom !== previous.dateFrom || filterDateTo !== previous.dateTo) {
      if (dateFrom === previous.dateFrom) setDateFrom(filterDateFrom);
      if (dateTo === previous.dateTo) setDateTo(filterDateTo);
      previousDateFilters.current = { dateFrom: filterDateFrom, dateTo: filterDateTo };
      lastSubmittedDateFilters.current = { dateFrom: filterDateFrom, dateTo: filterDateTo };
      return;
    }

    if (debouncedDateFrom !== dateFrom || debouncedDateTo !== dateTo) return;
    if (debouncedDateFrom === filterDateFrom && debouncedDateTo === filterDateTo) return;

    const lastSubmitted = lastSubmittedDateFilters.current;
    if (debouncedDateFrom === lastSubmitted.dateFrom && debouncedDateTo === lastSubmitted.dateTo) return;

    lastSubmittedDateFilters.current = { dateFrom: debouncedDateFrom, dateTo: debouncedDateTo };
    setParam({
      dateFrom: debouncedDateFrom,
      dateTo: debouncedDateTo,
      page: "1",
    });
  }, [
    dateFrom,
    dateTo,
    debouncedDateFrom,
    debouncedDateTo,
    filterDateFrom,
    filterDateTo,
    setParam,
  ]);

  const activeFilterCount = [
    filterCategory !== "all",
    !!filterDateFrom,
    !!filterDateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCategoryInput("");
    setShowCategoryOptions(false);
    setDateFrom("");
    setDateTo("");
    lastSubmittedDateFilters.current = { dateFrom: "", dateTo: "" };
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
          <div ref={categoryFilterRef} className="relative">
            <Input
              ref={categoryInputRef}
              id="filter-category"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showCategoryOptions}
              aria-controls="transaction-category-options"
              className={showCategoryOptions ? "pr-11" : undefined}
              value={categoryInput}
              onChange={(event) => {
                const value = event.target.value;
                setCategoryInput(value);
                setShowCategoryOptions(true);
                const matchingCategory = categories.find(
                  (category) => category.toLocaleLowerCase() === value.trim().toLocaleLowerCase(),
                );
                if (!value.trim() || matchingCategory) {
                  setParam({ category: matchingCategory, page: "1" });
                  if (matchingCategory) setCategoryInput(matchingCategory);
                }
              }}
              onFocus={() => setShowCategoryOptions(true)}
              onBlur={(event) => {
                if (!categoryFilterRef.current?.contains(event.relatedTarget)) {
                  setShowCategoryOptions(false);
                }
              }}
              placeholder="All categories"
              autoComplete="off"
            />
            {categoryInput && (
              <button
                type="button"
                aria-label="Clear category filter"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setCategoryInput("");
                  setParam({ category: undefined, page: "1" });
                  setShowCategoryOptions(true);
                  categoryInputRef.current?.focus();
                }}
                className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted hover:bg-canvas hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-strong"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
            {showCategoryOptions && (
              <div
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-hidden rounded-md border border-rule bg-paper shadow-lg"
              >
                <div
                  id="transaction-category-options"
                  role="listbox"
                  aria-label="Category options"
                  className="max-h-56 overflow-y-auto"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={filterCategory === "all"}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setCategoryInput("");
                      setShowCategoryOptions(false);
                      setParam({ category: undefined, page: "1" });
                    }}
                    className="block min-h-10 w-full border-b border-rule px-3 py-2 text-left text-sm text-fg hover:bg-canvas"
                  >
                    All categories
                  </button>
                  {categories
                    .filter((category) => category.toLocaleLowerCase().includes(categoryInput.trim().toLocaleLowerCase()))
                    .map((category) => (
                      <button
                        key={category}
                        type="button"
                        role="option"
                        aria-selected={filterCategory === category}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setCategoryInput(category);
                          setShowCategoryOptions(false);
                          setParam({ category, page: "1" });
                        }}
                        className="block min-h-10 w-full border-b border-rule px-3 py-2 text-left text-sm last:border-b-0 hover:bg-canvas"
                      >
                        <CategoryBadge name={category} color={categoryColors[category]} />
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="filter-from" className="text-xs uppercase tracking-widest text-fg-muted">From</Label>
          <Input
            id="filter-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            max={dateTo || undefined}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="filter-to" className="text-xs uppercase tracking-widest text-fg-muted">To</Label>
          <Input
            id="filter-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            min={dateFrom || undefined}
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

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-medium text-fg">Entries</h2>
        <div className="flex flex-wrap items-end gap-4">
          <TransactionSortSelect
            id="transaction-sort"
            sortOrder={sortOrder}
            onSortOrderChange={(order) => setParam({ sortOrder: order, page: "1" })}
          />
          <div role="group" aria-label="Group entries by" className="flex min-h-11 items-center gap-1">
            <span className="mr-1 text-sm text-fg-muted">Group by</span>
            {(["none", "category", "date"] as const).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={groupBy === g}
                onClick={() => setParam({ groupBy: g })}
                className={`min-h-11 border-b-2 px-2 text-sm capitalize transition-colors duration-150 ${groupBy === g ? "border-brass font-semibold text-fg" : "border-transparent text-fg-muted hover:text-fg"
                  }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-rule bg-paper">
        <TransactionsGrid
          transactions={transactions}
          categoryColors={categoryColors}
          currency={currency}
          groupBy={groupBy}
          rangeTotals={rangeTotals}
          rangeTotalsLabel={activeFilterCount > 0 ? "Filtered total" : "Grand total"}
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
