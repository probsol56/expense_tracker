import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getMonthRangeForKey } from "@/lib/dashboard";
import { fetchPage, type Page } from "@/lib/pagination";

const accountMonthlyBalanceSchema = z.object({
  account_id: z.string().uuid(),
  opening_balance: z.coerce.number(),
  income_amount: z.coerce.number(),
  closing_balance: z.coerce.number(),
});

const accountIncomeEntrySchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  merchant_name: z.string().nullable(),
  category_name: z.string().nullable(),
  notes: z.string().nullable(),
  amount: z.coerce.number().positive(),
  date: z.string().date(),
});

export type AccountMonthlyBalance = z.infer<typeof accountMonthlyBalanceSchema>;
export type AccountIncomeEntry = z.infer<typeof accountIncomeEntrySchema>;

const ACCOUNT_INCOME_SELECT = "id, account_id, merchant_name, category_name, notes, amount, date";

export async function fetchAccountMonthlyHistory(
  supabase: SupabaseClient,
  workspaceId: string,
  month: string,
): Promise<AccountMonthlyBalance[]> {
  const { from, to } = getMonthRangeForKey(month);
  const { data, error } = await supabase.rpc("account_monthly_history", {
    p_workspace_id: workspaceId,
    p_from: from,
    p_to: to,
  });

  if (error) throw error;
  return z.array(accountMonthlyBalanceSchema).parse(data ?? []);
}

export async function fetchAccountIncomeHistory(
  supabase: SupabaseClient,
  workspaceId: string,
  month: string,
  page: number,
  pageSize: number,
): Promise<Page<AccountIncomeEntry>> {
  const { from, to } = getMonthRangeForKey(month);
  const result = await fetchPage<unknown>(
    () =>
      supabase
        .from("transaction_activity")
        .select(ACCOUNT_INCOME_SELECT, { count: "exact" })
        .eq("workspace_id", workspaceId)
        .eq("kind", "income")
        .not("account_id", "is", null)
        .gte("date", from)
        .lt("date", to)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
    page,
    pageSize,
  );
  return { ...result, rows: z.array(accountIncomeEntrySchema).parse(result.rows) };
}

export async function fetchAccountIncomeForEdit(
  supabase: SupabaseClient,
  workspaceId: string,
  transactionId: string,
): Promise<AccountIncomeEntry | null> {
  const { data, error } = await supabase
    .from("transaction_activity")
    .select(ACCOUNT_INCOME_SELECT)
    .eq("workspace_id", workspaceId)
    .eq("id", transactionId)
    .eq("kind", "income")
    .not("account_id", "is", null)
    .maybeSingle();
  if (error) throw error;
  return data ? accountIncomeEntrySchema.parse(data) : null;
}
