"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button, Input, Label, LoadingOverlay, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import { PageHeader } from "@/components/page-header";
import { TransactionsGrid } from "@/app/(app)/transactions/transactions-grid";
import { PaginationBar } from "@/components/pagination-bar";
import { isLoanCategory, isTransferCategory, money } from "@/lib/utils";
import type { Account, Loan, Transaction } from "@/lib/types";

interface ReportsPageContentProps {
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
    accountId: string;
    dateFrom: string;
    dateTo: string;
  };
  accounts: Account[];
  loans: Loan[];
}

export function ReportsPageContent({
  transactions,
  currency,
  workspaceName,
  pagination,
  filters,
  accounts,
  loans,
}: ReportsPageContentProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Search-param-only navigations don't trigger the route's loading.tsx
  // Suspense boundary, so track pending state ourselves.
  const [isPending, startTransition] = useTransition();

  const { page, pageSize, totalPages, totalCount, totalRows } = pagination;
  const { accountId: filterAccountId, dateFrom: filterDateFrom, dateTo: filterDateTo } = filters;

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
    filterAccountId !== "all",
    !!filterDateFrom,
    !!filterDateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setParam({ accountId: undefined, dateFrom: undefined, dateTo: undefined, page: "1" });
  };

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === filterAccountId) ?? null,
    [accounts, filterAccountId],
  );

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
      <PageHeader
        eyebrow={`${workspaceName} · ${recordCount}`}
        title="Account statements"
        description="Pick an account, such as cash in hand or a bank account, to see only its entries."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="report-account" className="text-xs uppercase tracking-widest text-fg-muted">Account</Label>
          <Select
            value={filterAccountId}
            onValueChange={(v) => setParam({ accountId: v === "all" ? undefined : v, page: "1" })}
          >
            <SelectTrigger id="report-account">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="report-from" className="text-xs uppercase tracking-widest text-fg-muted">From</Label>
          <Input
            id="report-from"
            type="date"
            value={filterDateFrom}
            onChange={(e) => setParam({ dateFrom: e.target.value, page: "1" })}
            max={filterDateTo || undefined}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="report-to" className="text-xs uppercase tracking-widest text-fg-muted">To</Label>
          <Input
            id="report-to"
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

      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-[3px] border-double border-fg/50 pb-3">
        <div className="min-w-0">
          <h2 className="break-words font-display text-2xl font-medium text-fg">
            {selectedAccount ? selectedAccount.name : "All accounts"}
          </h2>
          {selectedAccount && (
            <p className="text-sm capitalize text-fg-muted">
              {selectedAccount.institution ? `${selectedAccount.institution} · ` : null}
              {selectedAccount.account_type || "deposit"}
            </p>
          )}
        </div>
        {selectedAccount && (
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Current balance</p>
            <p
              className={`font-display text-3xl font-medium tabular-nums lining-nums ${
                Number(selectedAccount.balance) < 0 ? "text-brick" : "text-fg"
              }`}
            >
              {money(Number(selectedAccount.balance), currency)}
            </p>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-lg border border-rule bg-paper">
        <TransactionsGrid
          transactions={transactions}
          currency={currency}
          groupBy="none"
          isFiltered={activeFilterCount > 0}
          onEdit={handleEdit}
          onAdd={() => router.push("/transactions")}
          onClearFilters={clearFilters}
        />
        <LoadingOverlay show={isPending} />
      </div>

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
    </div>
  );
}
