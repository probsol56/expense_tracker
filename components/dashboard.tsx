import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSearchParam } from "@/lib/utils";
import {
  EMPTY_DASHBOARD_SUMMARY,
  MAX_DASHBOARD_ACCOUNTS,
  MAX_DASHBOARD_LOANS,
  fetchActivityPage,
  fetchDashboardSummary,
  parseActivityType,
} from "@/lib/dashboard";
import { DEFAULT_PAGE_SIZE, clampPageSize, parsePage } from "@/lib/pagination";
import type { Account, Loan } from "@/lib/types";

export async function Dashboard({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { user, workspace, profile, supabase } = await getCurrentWorkspaceAndProfile();

  const page = parsePage(getSearchParam(searchParams, "page"));
  const pageSize = clampPageSize(Number(getSearchParam(searchParams, "pageSize") || DEFAULT_PAGE_SIZE));
  const activityType = parseActivityType(getSearchParam(searchParams, "type") || "all");
  const query = getSearchParam(searchParams, "q");

  if (!user || !supabase || !workspace) {
    return (
      <DashboardShell
        summary={EMPTY_DASHBOARD_SUMMARY}
        listTransactions={[]}
        accounts={[]}
        workspace={null}
        profile={null}
        pagination={{ page: 1, pageSize, totalPages: 1, totalCount: 0, totalRows: 0 }}
        activityType="all"
        query=""
      />
    );
  }

  const [summary, activity, { data: accounts }, { data: loans }] = await Promise.all([
    fetchDashboardSummary(supabase, workspace.id, new Date()),
    fetchActivityPage(supabase, workspace.id, { page, pageSize, type: activityType, query }),
    supabase
      .from("accounts")
      .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(MAX_DASHBOARD_ACCOUNTS),
    supabase
      .from("loans")
      .select("id, workspace_id, user_id, name, lender, principal_amount, outstanding_balance, status, date_started, notes, created_at, transaction_id")
      .eq("workspace_id", workspace.id)
      .order("date_started", { ascending: false })
      .limit(MAX_DASHBOARD_LOANS),
  ]);

  return (
    <DashboardShell
      summary={summary}
      listTransactions={activity.transactions}
      accounts={(accounts ?? []) as Account[]}
      loans={(loans ?? []) as Loan[]}
      workspace={workspace}
      profile={profile}
      pagination={{
        page: activity.page,
        pageSize,
        totalPages: activity.totalPages,
        totalCount: activity.totalCount,
        totalRows: activity.totalRows,
      }}
      activityType={activityType}
      query={query}
    />
  );
}
