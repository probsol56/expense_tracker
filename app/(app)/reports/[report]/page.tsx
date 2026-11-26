import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";
import { hasFolioApiKey } from "@/lib/server-config";
import { PICKER_LIMITS } from "@/lib/pagination";
import { getFolioReport, parseReportFilters, type ReportSubject } from "@/lib/folio-reports";
import type { ReportFilters } from "@/lib/validations";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { SignedOutNotice } from "@/components/signed-out-notice";
import { ReportParametersForm, type ReportOption } from "@/app/(app)/reports/[report]/report-parameters-form";

type Params = Promise<{ report: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const report = getFolioReport((await params).report);
  return { title: report?.title ?? "Report" };
}

/** Accounts or categories for the report's subject picker, sorted by name. */
async function fetchSubjectOptions(
  supabase: SupabaseClient,
  workspaceId: string,
  subject: ReportSubject,
): Promise<ReportOption[]> {
  const { data, error } =
    subject.kind === "account"
      ? await supabase
          .from("accounts")
          .select("id, name")
          .eq("workspace_id", workspaceId)
          .order("name", { ascending: true })
          .limit(PICKER_LIMITS.accounts)
      : await supabase
          .from("categories")
          .select("id, name")
          .eq("workspace_id", workspaceId)
          .in("type", [...subject.categoryTypes])
          .order("name", { ascending: true })
          .limit(PICKER_LIMITS.categories);
  if (error) throw error;
  return (data ?? []).map(({ id, name }) => ({ id: String(id), name: String(name) }));
}

/**
 * Ids from a stale URL (deleted row, other workspace) are dropped here; the
 * server action re-checks ownership regardless. A ledger with no valid account
 * in the URL starts on the first one, since it can't run without one.
 */
function keepKnownIds(filters: ReportFilters, options: ReportOption[]): ReportFilters {
  const knownIds = new Set(options.map(({ id }) => id));
  if (filters.kind === "account") {
    return { ...filters, accountId: knownIds.has(filters.accountId) ? filters.accountId : (options[0]?.id ?? "") };
  }
  return { ...filters, categoryIds: filters.categoryIds.filter((id) => knownIds.has(id)) };
}

/** Parameter form for any report in `FOLIO_REPORTS`; the report itself opens in /report-viewer. */
export default async function ReportParametersPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ report: slug }, sp] = await Promise.all([params, searchParams]);
  const report = getFolioReport(slug);
  if (!report) notFound();

  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !supabase || !workspace) {
    return (
      <SignedOutNotice
        title="Sign in to view reports"
        description="Create a workspace first, then return here to run your report."
      />
    );
  }

  const options = await fetchSubjectOptions(supabase, workspace.id, report.subject);

  return (
    <ReportParametersForm
      // Fresh draft state when switching between reports via the sidebar.
      key={report.slug}
      report={report}
      workspaceName={workspace.name}
      options={options}
      filters={keepKnownIds(parseReportFilters(report.subject.kind, sp), options)}
      folioReportsUrl={config.folioReportsUrl && hasFolioApiKey() ? config.folioReportsUrl : null}
    />
  );
}
