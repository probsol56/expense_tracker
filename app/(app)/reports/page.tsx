import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { ReportsPageContent } from "@/app/(app)/reports/reports-content";
import { getSearchParam } from "@/lib/utils";
import { fetchTransactionsPage } from "@/lib/transactions";
import type { Account, Loan } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 10;

function readParams(searchParams: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, Number(getSearchParam(searchParams, "page") || 1));
  const pageSize = Math.max(
    1,
    Number(getSearchParam(searchParams, "pageSize") || DEFAULT_PAGE_SIZE),
  );
  const accountId = getSearchParam(searchParams, "accountId") || "all";
  const dateFrom = getSearchParam(searchParams, "dateFrom");
  const dateTo = getSearchParam(searchParams, "dateTo");
  return { page, pageSize, accountId, dateFrom, dateTo };
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

  if (!user || !supabase) {
    return (
      <ReportsPageContent
        transactions={[]}
        currency={currency}
        workspaceName={workspaceName}
        pagination={{ page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1, totalCount: 0, totalRows: 0 }}
        filters={{ accountId: "all", dateFrom: "", dateTo: "" }}
        accounts={[]}
        loans={[]}
      />
    );
  }

  const params = readParams(sp);

  const [result, { data: accounts }, { data: loans }] = await Promise.all([
    fetchTransactionsPage(supabase, {
      page: params.page,
      pageSize: params.pageSize,
      accountId: params.accountId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
    supabase
      .from("accounts")
      .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
      .order("created_at", { ascending: false }),
    workspace
      ? supabase
          .from("loans")
          .select("id, workspace_id, user_id, name, lender, principal_amount, outstanding_balance, status, date_started, notes, created_at, transaction_id")
          .eq("workspace_id", workspace.id)
          .order("date_started", { ascending: false })
      : Promise.resolve({ data: [] as Loan[] }),
  ]);

  return (
    <ReportsPageContent
      transactions={result.transactions}
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
      }}
      accounts={(accounts ?? []) as Account[]}
      loans={(loans ?? []) as Loan[]}
    />
  );
}
