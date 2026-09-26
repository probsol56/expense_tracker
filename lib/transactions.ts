import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transaction } from "@/lib/types";

export type TransactionRow = {
  id: string;
  merchant_id?: string | null;
  category_id?: string | null;
  account_id?: string | null;
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
    merchant: row.merchant?.name ?? "",
    category: row.category?.name ?? "",
    notes: row.notes ?? null,
    amount: row.amount,
    date: row.date,
    status: row.status ?? "cleared",
  };
}

const BASE_SELECT =
  "id, merchant_id, category_id, account_id, merchant:merchants(name), category:categories(name), notes, amount, date, status";

// Same columns, but with an inner join on categories so `.eq("category.name", …)`
// can filter server-side. Only used when a category filter is active — an inner
// join would otherwise drop transactions with no category.
const CATEGORY_FILTERED_SELECT =
  "id, merchant_id, category_id, account_id, merchant:merchants(name), category:categories!inner(name), notes, amount, date, status";

export type TransactionPageParams = {
  page: number;
  pageSize: number;
  category?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type TransactionPageResult = {
  transactions: Transaction[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  totalRows: number;
};

/**
 * Fetches one page of the transaction ledger with filtering and counting done
 * entirely by Postgres (`.range()` + `count: "exact"`) instead of pulling the
 * whole table into the server and slicing it in memory — the previous
 * approach re-fetched every transaction on every request regardless of page size.
 */
export async function fetchTransactionsPage(
  supabase: SupabaseClient,
  { page, pageSize, category, accountId, dateFrom, dateTo }: TransactionPageParams,
): Promise<TransactionPageResult> {
  const hasCategoryFilter = !!category && category !== "all";
  const hasAccountFilter = !!accountId && accountId !== "all";

  const buildQuery = () => {
    let q = supabase
      .from("transactions")
      .select(hasCategoryFilter ? CATEGORY_FILTERED_SELECT : BASE_SELECT, { count: "exact" })
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (hasCategoryFilter) q = q.eq("category.name", category as string);
    if (hasAccountFilter) q = q.eq("account_id", accountId as string);
    if (dateFrom) q = q.gte("date", dateFrom);
    if (dateTo) q = q.lte("date", dateTo);
    return q;
  };

  const [{ count: totalRows }, first] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }),
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

function pageRange(page: number, pageSize: number): [number, number] {
  const start = (Math.max(1, page) - 1) * pageSize;
  return [start, start + pageSize - 1];
}
