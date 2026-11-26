import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { config } from "@/lib/config";
import { hasFolioApiKey } from "@/lib/server-config";
import { getFolioReport, parseReportFilters } from "@/lib/folio-reports";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { ReportWindow } from "@/app/report-viewer/[report]/report-window";

type Params = Promise<{ report: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const report = getFolioReport((await params).report);
  return {
    title: report ? `${report.title} report` : "Report",
    robots: { index: false, follow: false },
  };
}

/**
 * Full-window report viewer, opened in a new tab from /reports/[report].
 * Lives outside the (app) group so the sidebar shell doesn't crowd the report.
 * Filters come from the URL; the token action re-validates them and re-checks
 * account/category ownership against the session's workspace.
 */
export default async function ReportViewerPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ report: slug }, sp] = await Promise.all([params, searchParams]);
  const report = getFolioReport(slug);
  if (!report) notFound();

  const { user, workspace } = await getCurrentWorkspaceAndProfile();
  if (!user) redirect("/login");
  if (!workspace) redirect("/onboarding");

  return (
    <ReportWindow
      report={report}
      filters={parseReportFilters(report.subject.kind, sp)}
      folioReportsUrl={config.folioReportsUrl && hasFolioApiKey() ? config.folioReportsUrl : null}
    />
  );
}
