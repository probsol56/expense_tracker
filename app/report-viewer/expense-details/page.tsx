import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";
import { hasFolioApiKey } from "@/lib/server-config";
import { parseExpenseReportFilters } from "@/lib/expense-report";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { ExpenseReportWindow } from "@/app/report-viewer/expense-details/expense-report-window";

export const metadata: Metadata = {
  title: "Expense details report",
  robots: { index: false, follow: false },
};

/**
 * Full-window report viewer, opened in a new tab from /reports/expense-details.
 * Lives outside the (app) group so the sidebar shell doesn't crowd the report.
 * Filters come from the URL; the token action re-validates them and re-checks
 * category ownership against the session's workspace.
 */
export default async function ExpenseReportViewerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { user, workspace } = await getCurrentWorkspaceAndProfile();
  if (!user) redirect("/login");
  if (!workspace) redirect("/onboarding");

  return (
    <ExpenseReportWindow
      filters={parseExpenseReportFilters(sp)}
      folioReportsUrl={config.folioReportsUrl && hasFolioApiKey() ? config.folioReportsUrl : null}
    />
  );
}
