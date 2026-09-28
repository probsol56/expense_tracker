import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { pageRange } from "@/lib/pagination";
import { toTransaction, type TransactionRow } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";

export const MAX_DASHBOARD_LOANS = 100;
export const MAX_DASHBOARD_ACCOUNTS = 100;

export type ActivityType = "all" | "expenses" | "income" | "loan" | "transfer";

const ACTIVITY_KIND_BY_TYPE: Record<Exclude<ActivityType, "all">, string> = {
  expenses: "expense",
  income: "income",
  loan: "loan",
  transfer: "transfer",
};

const ACTIVITY_SELECT =
  "id, merchant_id, category_id, account_id, merchant_name, category_name, notes, amount, date, status";

const dashboardSummarySchema = z.object({
  month_spending: z.coerce.number(),
  month_income: z.coerce.number(),
  month_expense_count: z.coerce.number(),
  accounts_balance: z.coerce.number(),
  account_count: z.coerce.number(),
  outstanding_loan_balance: z.coerce.number(),
  loan_paid: z.coerce.number(),
  active_loan_count: z.coerce.number(),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

export const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  month_spending: 0,
  month_income: 0,
  month_expense_count: 0,
  accounts_balance: 0,
  account_count: 0,
  outstanding_loan_balance: 0,
  loan_paid: 0,
  active_loan_count: 0,
};

const activityRowSchema = z.object({
  id: z.string(),
  merchant_id: z.string().nullable(),
  category_id: z.string().nullable(),
  account_id: z.string().nullable(),
  merchant_name: z.string().nullable(),
  category_name: z.string().nullable(),
  notes: z.string().nullable(),
  amount: z.coerce.number(),
  date: z.string(),
  status: z.enum(["cleared", "pending"]).nullable(),
});

type ActivityRow = z.infer<typeof activityRowSchema>;

export type ActivityPageParams = {
  page: number;
  pageSize: number;
  type: ActivityType;
  query: string;
};

export type ActivityPageResult = {
  transactions: Transaction[];
  page: number;
  totalPages: number;
  totalCount: number;
  totalRows: number;
};

export function parseActivityType(value: string): ActivityType {
  return value === "expenses" || value === "income" || value === "loan" || value === "transfer" ? value : "all";
}

export function getMonthRange(now: Date): { from: string; to: string } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 1));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

// PostgREST's `or` filter is comma/paren-delimited and ilike treats % and _ as
// wildcards, so those characters can't pass through from user input.
export function toSearchPattern(query: string): string {
  const safe = query.replace(/[,()"\\%_*]/g, " ").trim();
  return `%${safe}%`;
}

function toActivityTransaction(row: ActivityRow): Transaction {
  const shaped: TransactionRow = {
    id: row.id,
    merchant_id: row.merchant_id,
    category_id: row.category_id,
    account_id: row.account_id,
    merchant: { name: row.merchant_name },
    category: { name: row.category_name },
    notes: row.notes,
    amount: row.amount,
    date: row.date,
    status: row.status ?? undefined,
  };
  return toTransaction(shaped);
}

export async function fetchDashboardSummary(
  supabase: SupabaseClient,
  workspaceId: string,
  now: Date,
): Promise<DashboardSummary> {
  const { from, to } = getMonthRange(now);
  const { data, error } = await supabase
    .rpc("dashboard_summary", { p_workspace_id: workspaceId, p_from: from, p_to: to })
    .single();
  if (error) throw error;
  return dashboardSummarySchema.parse(data);
}

export async function fetchActivityPage(
  supabase: SupabaseClient,
  workspaceId: string,
  { page, pageSize, type, query }: ActivityPageParams,
): Promise<ActivityPageResult> {
  const trimmedQuery = query.trim();

  const buildQuery = () => {
    let request = supabase
      .from("transaction_activity")
      .select(ACTIVITY_SELECT, { count: "exact" })
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (type !== "all") request = request.eq("kind", ACTIVITY_KIND_BY_TYPE[type]);
    if (trimmedQuery) {
      const pattern = toSearchPattern(trimmedQuery);
      request = request.or(`merchant_name.ilike.${pattern},category_name.ilike.${pattern},notes.ilike.${pattern}`);
    }
    return request;
  };

  const requestedPage = Math.max(1, page);

  const [{ count: totalRows, error: totalError }, first] = await Promise.all([
    supabase
      .from("transaction_activity")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    buildQuery().range(...pageRange(requestedPage, pageSize)),
  ]);
  if (totalError) throw totalError;
  if (first.error) throw first.error;

  let rows = z.array(activityRowSchema).parse(first.data ?? []);
  let totalCount = first.count ?? 0;
  let totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(requestedPage, totalPages);

  if (safePage !== requestedPage) {
    const refetched = await buildQuery().range(...pageRange(safePage, pageSize));
    if (refetched.error) throw refetched.error;
    rows = z.array(activityRowSchema).parse(refetched.data ?? []);
    totalCount = refetched.count ?? totalCount;
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  }

  return {
    transactions: rows.map(toActivityTransaction),
    page: safePage,
    totalPages,
    totalCount,
    totalRows: totalRows ?? 0,
  };
}
