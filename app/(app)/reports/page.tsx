import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { ReportsPageContent } from "@/app/(app)/reports/reports-content";
import { getSearchParam } from "@/lib/utils";
import {
  fetchTransactionOpeningBalance,
  fetchTransactionRunningBalances,
  fetchTransactionTotals,
  fetchTransactionsPage,
} from "@/lib/transactions";
import { DEFAULT_PAGE_SIZE, PICKER_LIMITS, clampPageSize, parsePage } from "@/lib/pagination";
import { parseTransactionSortOrder } from "@/lib/transaction-sort";
import type { Account, Loan } from "@/lib/types";

function readParams(searchParams: Record<string, string | string[] | undefined>) {
  const page = parsePage(getSearchParam(searchParams, "page"));
  const pageSize = clampPageSize(Number(getSearchParam(searchParams, "pageSize") || DEFAULT_PAGE_SIZE));
  const accountId = getSearchParam(searchParams, "accountId") || "all";
  const dateFrom = getSearchParam(searchParams, "dateFrom");
  const dateTo = getSearchParam(searchParams, "dateTo");
  const sortOrder = parseTransactionSortOrder(getSearchParam(searchParams, "sortOrder"));
  return { page, pageSize, accountId, dateFrom, dateTo, sortOrder };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();

  const currency = workspace?.base_currency || "BDT";
  const workspaceName = workspace?.name || "Personal Workspace";

  if (!user || !supabase || !workspace) {
    return (
      <ReportsPageContent
        transactions={[]}
        openingBalance={0}
        runningBalances={{}}
        currency={currency}
        workspaceName={workspaceName}
        pagination={{ page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1, totalCount: 0, totalRows: 0 }}
        filters={{ accountId: "all", dateFrom: "", dateTo: "", sortOrder: "desc" }}
        accounts={[]}
        loans={[]}
      />
    );
  }

  const params = readParams(sp);

  const [rangeTotals, result, { data: accounts }, { data: loans }] = await Promise.all([
    fetchTransactionTotals(supabase, workspace.id, {
      accountId: params.accountId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
    fetchTransactionsPage(supabase, {
      page: params.page,
      pageSize: params.pageSize,
      accountId: params.accountId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortOrder: params.sortOrder,
    }),
    supabase
      .from("accounts")
      .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(PICKER_LIMITS.accounts),
    supabase
      .from("loans")
      .select("id, workspace_id, user_id, name, lender, principal_amount, outstanding_balance, status, date_started, notes, created_at, transaction_id")
      .eq("workspace_id", workspace.id)
      .order("date_started", { ascending: false })
      .limit(PICKER_LIMITS.loans),
  ]);
  const [openingBalance, runningBalances] = await Promise.all([
    fetchTransactionOpeningBalance(supabase, workspace.id, {
      accountId: params.accountId,
      before: params.dateFrom,
    }),
    result.transactions.length
      ? fetchTransactionRunningBalances(
          supabase,
          workspace.id,
          params.accountId,
          result.transactions.map(({ id }) => id),
        )
      : Promise.resolve({}),
  ]);

  return (
    <ReportsPageContent
      transactions={result.transactions}
      openingBalance={openingBalance}
      runningBalances={runningBalances}
      rangeTotals={rangeTotals}
      currency={currency}
      workspaceName={workspaceName}
      pagination={{
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        totalRows: result.totalRows,
      }}
      filters={{
        accountId: params.accountId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortOrder: params.sortOrder,
      }}
      accounts={(accounts ?? []) as Account[]}
      loans={(loans ?? []) as Loan[]}
    />
  );
}
