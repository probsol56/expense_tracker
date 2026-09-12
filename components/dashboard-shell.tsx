"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionList } from "@/components/transaction-list";
import { AccountList } from "@/components/account-list";
import { AddTransactionModal } from "@/components/add-transaction-modal";
import type { Account, Loan, LoanPayment, Transaction, Workspace, Profile } from "@/lib/types";
import type { ActivityType } from "@/components/dashboard";

export function DashboardShell({
  transactions,
  listTransactions,
  accounts,
  loans,
  loanPayments,
  workspace,
  profile,
  pagination,
  activityType,
  query,
}: {
  /** Full transaction set — used for summary cards. */
  transactions: Transaction[];
  /** Current page of the filtered "Recent activity" list (computed on the server). */
  listTransactions: Transaction[];
  accounts: Account[];
  loans?: Loan[];
  loanPayments?: LoanPayment[];
  workspace?: Workspace | null;
  profile?: Profile | null;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    totalRows: number;
  };
  activityType: ActivityType;
  query: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currency = workspace?.base_currency || "BDT";

  // Search-param-only navigations (pagination, filters) don't trigger the
  // route's loading.tsx Suspense boundary, so track pending state ourselves.
  const [isPending, startTransition] = useTransition();

  // Pagination & filters live in the URL; the client only navigates.
  const setParam = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <>
      <DashboardHeader
        profile={profile}
        workspace={workspace}
        onAdd={() => setShowAdd(true)}
      />
      <SummaryCards
        transactions={transactions}
        accounts={accounts}
        loans={loans || []}
        loanPayments={loanPayments || []}
        currency={currency}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <TransactionList
          transactions={listTransactions}
          pagination={pagination}
          filterType={activityType}
          setFilterType={(type) => setParam({ type, page: "1" })}
          query={query}
          onQueryChange={(value) => setParam({ q: value || undefined, page: "1" })}
          onPageChange={(p) => setParam({ page: String(p) })}
          onPageSizeChange={(size) => setParam({ pageSize: String(size), page: "1" })}
          currency={currency}
          isPending={isPending}
          accounts={accounts}
          loans={loans}
        />
        <AccountList accounts={accounts} currency={currency} />
      </div>
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} currency={currency} accounts={accounts} loans={loans} />}
    </>
  );
}
