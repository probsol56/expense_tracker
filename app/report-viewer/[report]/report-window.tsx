"use client";

import { useCallback } from "react";
import { Alert } from "@/components/ui";
import { FolioReportViewer } from "@/components/folio-report-viewer";
import { getReportToken } from "@/app/(app)/reports/actions";
import type { FolioReport } from "@/lib/folio-reports";
import type { ReportFilters } from "@/lib/validations";

/** The Folio viewer alone, filling the window — no app chrome around it. */
export function ReportWindow({
  report,
  filters,
  folioReportsUrl,
}: {
  report: FolioReport;
  filters: ReportFilters;
  /** Null when the report server URL or API key isn't configured. */
  folioReportsUrl: string | null;
}) {
  const { slug } = report;
  const getToken = useCallback(() => getReportToken(slug, filters), [slug, filters]);
  const title = `${report.title} report`;

  return (
    <main className="flex h-dvh flex-col bg-canvas">
      <h1 className="sr-only">{title}</h1>
      {folioReportsUrl ? (
        <FolioReportViewer
          serverUrl={folioReportsUrl}
          report={report.folioId}
          title={title}
          getToken={getToken}
          frameClassName="min-h-0 flex-1 bg-paper"
        />
      ) : (
        <Alert tone="warning" className="m-4">
          Reports aren&apos;t configured on this server yet. Set the report server URL and API key, then reload.
        </Alert>
      )}
    </main>
  );
}
