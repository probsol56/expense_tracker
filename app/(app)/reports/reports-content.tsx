"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarDays, PieChart, Wallet, X } from "lucide-react";
import { Button, Card, Input, LoadingOverlay, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { AddTransactionModal } from "@/components/add-transaction-modal";
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

  const netTotal = useMemo(
    () => transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions],
  );

  // Loan disbursements/repayments are posted automatically from the Loans
  // page and keep a loan's outstanding balance in sync — editing them here
  // would desync that balance, so send people there instead. Transfers are
  // the same story, managed from the Accounts page.
  const handleEdit = (transaction: Transaction) => {
    if (isLoanCategory(transaction.category) || isTransferCategory(transaction.category)) return;
    setEditingTransaction(transaction);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
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
          Reports by Account
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Pick an account — Cash in Hand, Cash at Bank, etc. — to see only its transactions.
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-ink-900/60 sm:flex-row sm:items-end">
        <div className="flex items-center gap-1.5 self-center text-xs font-semibold text-slate-500 dark:text-slate-400 sm:self-auto">
          <PieChart size={13} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>

        {/* Account */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Account
          </label>
          <Select
            value={filterAccountId}
            onValueChange={(v) => setParam({ accountId: v === "all" ? undefined : v, page: "1" })}
          >
            <SelectTrigger className="h-9 text-sm">
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
      </div>

      {/* ── Selected account summary ── */}
      {selectedAccount && (
        <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-ink-800/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900">
              <Wallet size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                {selectedAccount.name}
              </p>
              <p className="truncate text-xs text-slate-400 capitalize">
                {selectedAccount.account_type || "Deposit"} · Current balance {money(Number(selectedAccount.balance), currency)}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Net for filtered range
            </span>
            <p
              className={`text-xl font-extrabold tabular-nums tracking-tight ${
                netTotal >= 0 ? "text-teal-600 dark:text-teal-400" : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {netTotal > 0 ? "+" : ""}
              {money(netTotal, currency)}
            </p>
          </div>
        </div>
      )}

      <Card className="relative overflow-hidden shadow-card">
        <TransactionsGrid
          transactions={transactions}
          currency={currency}
          groupBy="none"
          onEdit={handleEdit}
          onAdd={() => router.push("/transactions")}
        />
        <LoadingOverlay show={isPending} />
      </Card>

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
