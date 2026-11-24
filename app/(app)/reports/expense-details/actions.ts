"use server";

import { z } from "zod";
import { config } from "@/lib/config";
import { toActionError, toCaughtActionError } from "@/lib/errors";
import { EXPENSE_REPORT_ID } from "@/lib/expense-report";
import { createFolioViewToken, FolioRequestError } from "@/lib/folio";
import { PICKER_LIMITS } from "@/lib/pagination";
import { expenseReportFiltersSchema } from "@/lib/validations";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";

const TOKEN_MINUTES = 30;
const categoryRowsSchema = z.array(z.object({ id: z.string().uuid() }));

export type ExpenseReportTokenResult = { token: string } | { error: string };

/**
 * Mints a Folio view token for the "expense details" report.
 *
 * Folio queries the database directly (outside RLS), so every parameter is
 * locked into the token server-side: the workspace comes from the session,
 * never the client, and each category id is re-checked against that workspace.
 */
export async function getExpenseReportToken(input: unknown): Promise<ExpenseReportTokenResult> {
  const parsed = expenseReportFiltersSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid report filters." };
  const { categoryIds, fromDate, toDate } = parsed.data;

  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !workspace) return { error: "Sign in to view reports." };
  if (!config.folioReportsUrl) return { error: "Reports aren't configured on this server yet." };

  // No selection means "all expense categories" — resolved here so the report
  // always receives an explicit, workspace-owned list.
  const requested = [...new Set(categoryIds)];
  let query = supabase
    .from("categories")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("type", "expense")
    .limit(PICKER_LIMITS.categories);
  if (requested.length > 0) query = query.in("id", requested);

  const { data, error } = await query;
  if (error) return { error: toActionError(error, "Couldn't load your categories.") };

  const rows = categoryRowsSchema.safeParse(data ?? []);
  if (!rows.success) return { error: "Couldn't load your categories." };
  const ownedIds = rows.data.map(({ id }) => id);

  if (requested.length > 0 && ownedIds.length !== requested.length) {
    return { error: "One or more selected categories no longer exist. Refresh and try again." };
  }
  if (ownedIds.length === 0) return { error: "Add an expense category to run this report." };

  try {
    const { token } = await createFolioViewToken({
      report: EXPENSE_REPORT_ID,
      minutes: TOKEN_MINUTES,
      params: {
        p_workspace_id: workspace.id,
        p_from_date: fromDate,
        p_to_date: toDate,
        // Folio has no list parameter type: send comma-joined text, which the
        // get_ledger query splits with string_to_array(@p_category_ids, ',')::uuid[].
        p_category_ids: ownedIds.join(","),
      },
    });
    return { token };
  } catch (caught: unknown) {
    if (caught instanceof FolioRequestError && caught.status === 404) {
      return { error: "The report isn't available on the report server." };
    }
    return { error: toCaughtActionError(caught, "The report server didn't respond. Try again in a moment.") };
  }
}
