import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { pageRange } from "@/lib/pagination";
import type { TransactionSortOrder } from "@/lib/transaction-sort";
import type { Transaction } from "@/lib/types";

export type TransactionRow = {
  id: string;
  merchant_id?: string | null;
  category_id?: string | null;
  account_id?: string | null;
  loan_id?: string | null;
  merchant_name?: string | null;
  category_name?: string | null;
  merchant?: { name?: string | null } | null;
  category?: { name?: string | null } | null;
  notes?: string | null;
  amount: number;
  date: string;
  status?: "cleared" | "pending";
};

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    merchant_id: row.merchant_id ?? null,
    category_id: row.category_id ?? null,
    account_id: row.account_id ?? null,
    loan_id: row.loan_id ?? null,
    merchant: row.merchant_name ?? row.merchant?.name ?? "",
    category: row.category_name ?? row.category?.name ?? "",
    notes: row.notes ?? null,
    amount: row.amount,
    date: row.date,
    status: row.status ?? "cleared",
  };
}

const TRANSACTION_ACTIVITY_SELECT =
  "id, merchant_id, category_id, account_id, loan_id, merchant_name, category_name, notes, amount, date, status";

export type TransactionPageParams = {
  page: number;
  pageSize: number;
  category?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: TransactionSortOrder;
};

export type TransactionPageResult = {
  transactions: Transaction[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  totalRows: number;
};

const transactionTotalsSchema = z.object({
  money_out: z.coerce.number(),
  money_in: z.coerce.number(),
});

const openingBalanceSchema = z.object({
  opening_balance: z.coerce.number(),
});

const runningBalancesSchema = z.array(
  z.object({
    transaction_id: z.string().uuid(),
    running_balance: z.coerce.number(),
  }),
);

export type TransactionTotals = { moneyOut: number; moneyIn: number };

export async function fetchTransactionOpeningBalance(
  supabase: SupabaseClient,
  workspaceId: string,
  { accountId, before }: { accountId?: string; before?: string },
): Promise<number> {
  const { data, error } = await supabase
    .rpc("transaction_opening_balance", {
      p_workspace_id: workspaceId,
      p_account_id: accountId && accountId !== "all" ? accountId : null,
      p_before: before || null,
    })
    .single();
  if (error) throw error;
  return openingBalanceSchema.parse(data).opening_balance;
}

export async function fetchTransactionRunningBalances(
  supabase: SupabaseClient,
  workspaceId: string,
  accountId: string | undefined,
  transactionIds: string[],
): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("transaction_running_balances", {
    p_workspace_id: workspaceId,
    p_account_id: accountId && accountId !== "all" ? accountId : null,
    p_transaction_ids: transactionIds,
  });
  if (error) throw error;
  const parsed = runningBalancesSchema.parse(data);
  if (parsed.length !== new Set(transactionIds).size) {
    throw new Error("Could not calculate the running balance for every report entry.");
  }
  return Object.fromEntries(parsed.map(({ transaction_id, running_balance }) => [transaction_id, running_balance]));
}

/** Sums the whole filtered range in Postgres, not just the visible page. */
export async function fetchTransactionTotals(
  supabase: SupabaseClient,
  workspaceId: string,
  { accountId, category, dateFrom, dateTo }: Pick<TransactionPageParams, "accountId" | "category" | "dateFrom" | "dateTo">,
): Promise<TransactionTotals> {
  const { data, error } = await supabase
    .rpc("transaction_totals", {
      p_workspace_id: workspaceId,
      p_account_id: accountId && accountId !== "all" ? accountId : null,
      p_category: category && category !== "all" ? category : null,
      p_from: dateFrom || null,
      p_to: dateTo || null,
    })
    .single();
  if (error) throw error;
  const parsed = transactionTotalsSchema.parse(data);
  return { moneyOut: parsed.money_out, moneyIn: parsed.money_in };
}

/**
 * Fetches one page of the transaction ledger with filtering and counting done
 * entirely by Postgres (`.range()` + `count: "exact"`) instead of pulling the
 * whole table into the server and slicing it in memory — the previous
 * approach re-fetched every transaction on every request regardless of page size.
 */
export async function fetchTransactionsPage(
  supabase: SupabaseClient,
  { page, pageSize, category, accountId, dateFrom, dateTo, sortOrder = "desc" }: TransactionPageParams,
): Promise<TransactionPageResult> {
  const hasCategoryFilter = !!category && category !== "all";
  const hasAccountFilter = !!accountId && accountId !== "all";

  const buildQuery = () => {
    let q = supabase
      .from("transaction_activity")
      .select(TRANSACTION_ACTIVITY_SELECT, { count: "exact" })
      .neq("kind", "loan")
      .order("date", { ascending: sortOrder === "asc" })
      .order("created_at", { ascending: sortOrder === "asc" })
      .order("id", { ascending: sortOrder === "asc" });
    if (hasCategoryFilter) q = q.eq("category_name", category as string);
    if (hasAccountFilter) q = q.eq("account_id", accountId as string);
    if (dateFrom) q = q.gte("date", dateFrom);
    if (dateTo) q = q.lte("date", dateTo);
    return q;
  };

  const [{ count: totalRows }, first] = await Promise.all([
    supabase.from("transaction_activity").select("id", { count: "exact", head: true }).neq("kind", "loan"),
    buildQuery().range(...pageRange(page, pageSize)),
  ]);

  const { count } = first;
  let { data } = first;
  let totalCount = count ?? 0;
  let totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  // The requested page fell past the end of the filtered result set (e.g. a
  // filter change shrank it, or the URL was edited by hand) — refetch once
  // with the clamped page now that the true count is known.
  if (safePage !== page) {
    const refetched = await buildQuery().range(...pageRange(safePage, pageSize));
    data = refetched.data;
    totalCount = refetched.count ?? totalCount;
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  }

  return {
    transactions: ((data ?? []) as TransactionRow[]).map(toTransaction),
    page: safePage,
    pageSize,
    totalPages,
    totalCount,
    totalRows: totalRows ?? 0,
  };
}
