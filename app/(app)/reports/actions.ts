"use server";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";
import { toActionError, toCaughtActionError } from "@/lib/errors";
import { FOLIO_REPORTS, folioReportSlugSchema, type ReportSubject } from "@/lib/folio-reports";
import { createFolioViewToken, FolioRequestError, type FolioParamValue } from "@/lib/folio";
import { PICKER_LIMITS } from "@/lib/pagination";
import { reportFiltersSchema, type ReportFilters } from "@/lib/validations";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";

const TOKEN_MINUTES = 30;
const idRowsSchema = z.array(z.object({ id: z.string().uuid() }));

export type ReportTokenResult = { token: string } | { error: string };

type SubjectParams = { params: Record<string, FolioParamValue> } | { error: string };

/** Checks the one account belongs to the session's workspace. */
async function resolveAccountParams(
  supabase: SupabaseClient,
  workspaceId: string,
  accountId: string,
): Promise<SubjectParams> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", accountId)
    .limit(1);
  if (error) return { error: toActionError(error, "Couldn't load your account.") };

  const rows = idRowsSchema.safeParse(data ?? []);
  if (!rows.success) return { error: "Couldn't load your account." };
  if (rows.data.length === 0) return { error: "That account no longer exists. Refresh and try again." };
  return { params: { p_account_id: accountId } };
}

/**
 * Re-checks each category against the workspace. No selection means "all
 * categories this report covers", resolved here so the report always receives
 * an explicit, workspace-owned list.
 */
async function resolveCategoryParams(
  supabase: SupabaseClient,
  workspaceId: string,
  subject: Extract<ReportSubject, { kind: "categories" }>,
  categoryIds: string[],
): Promise<SubjectParams> {
  const requested = [...new Set(categoryIds)];
  let query = supabase
    .from("categories")
    .select("id")
    .eq("workspace_id", workspaceId)
    .in("type", [...subject.categoryTypes])
    .limit(PICKER_LIMITS.categories);
  if (requested.length > 0) query = query.in("id", requested);

  const { data, error } = await query;
  if (error) return { error: toActionError(error, "Couldn't load your categories.") };

  const rows = idRowsSchema.safeParse(data ?? []);
  if (!rows.success) return { error: "Couldn't load your categories." };
  const ownedIds = rows.data.map(({ id }) => id);

  if (requested.length > 0 && ownedIds.length !== requested.length) {
    return { error: "One or more selected categories no longer exist. Refresh and try again." };
  }
  if (ownedIds.length === 0) return { error: `Add an ${subject.noun} to run this report.` };

  // Folio has no list parameter type: send comma-joined text, which the
  // report query splits with string_to_array(@p_category_ids, ',')::uuid[].
  return { params: { p_category_ids: ownedIds.join(",") } };
}

function resolveSubjectParams(
  supabase: SupabaseClient,
  workspaceId: string,
  subject: ReportSubject,
  filters: ReportFilters,
): Promise<SubjectParams> | SubjectParams {
  if (subject.kind === "account" && filters.kind === "account") {
    return resolveAccountParams(supabase, workspaceId, filters.accountId);
  }
  if (subject.kind === "categories" && filters.kind === "categories") {
    return resolveCategoryParams(supabase, workspaceId, subject, filters.categoryIds);
  }
  return { error: "Those filters don't match this report." };
}

/**
 * Mints a Folio view token for one of the reports in `FOLIO_REPORTS`.
 *
 * Folio queries the database directly (outside RLS), so every parameter is
 * locked into the token server-side: the workspace comes from the session,
 * never the client, and each account/category id is re-checked against it.
 */
export async function getReportToken(slug: unknown, input: unknown): Promise<ReportTokenResult> {
  const parsedSlug = folioReportSlugSchema.safeParse(slug);
  if (!parsedSlug.success) return { error: "That report doesn't exist." };
  const report = FOLIO_REPORTS[parsedSlug.data];

  const parsed = reportFiltersSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid report filters." };
  const filters = parsed.data;

  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !workspace) return { error: "Sign in to view reports." };
  if (!config.folioReportsUrl) return { error: "Reports aren't configured on this server yet." };

  const subject = await resolveSubjectParams(supabase, workspace.id, report.subject, filters);
  if ("error" in subject) return subject;

  try {
    const { token } = await createFolioViewToken({
      report: report.folioId,
      minutes: TOKEN_MINUTES,
      params: {
        p_workspace_id: workspace.id,
        p_from_date: filters.fromDate,
        p_to_date: filters.toDate,
        ...subject.params,
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
