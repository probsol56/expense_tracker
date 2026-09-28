import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const loanSummarySchema = z.object({
  total_borrowed: z.coerce.number(),
  total_repaid: z.coerce.number(),
  total_outstanding: z.coerce.number(),
});

export type LoanSummary = z.infer<typeof loanSummarySchema>;

const recurringSummarySchema = z.object({
  active_count: z.coerce.number(),
  monthly_expense: z.coerce.number(),
  monthly_income: z.coerce.number(),
});

export type RecurringSummary = z.infer<typeof recurringSummarySchema>;

export async function fetchLoanSummary(supabase: SupabaseClient, workspaceId: string): Promise<LoanSummary> {
  const { data, error } = await supabase.rpc("loan_summary", { p_workspace_id: workspaceId }).single();
  if (error) throw error;
  return loanSummarySchema.parse(data);
}

export async function fetchRecurringSummary(supabase: SupabaseClient, workspaceId: string): Promise<RecurringSummary> {
  const { data, error } = await supabase.rpc("recurring_summary", { p_workspace_id: workspaceId }).single();
  if (error) throw error;
  return recurringSummarySchema.parse(data);
}
