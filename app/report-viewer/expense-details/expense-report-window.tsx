"use client";

import { useCallback } from "react";
import { Alert } from "@/components/ui";
import { FolioReportViewer } from "@/components/folio-report-viewer";
import { getExpenseReportToken } from "@/app/(app)/reports/expense-details/actions";
import { EXPENSE_REPORT_ID } from "@/lib/expense-report";
import type { ExpenseReportFilters } from "@/lib/validations";

/** The Folio viewer alone, filling the window — no app chrome around it. */
export function ExpenseReportWindow({
  filters,
  folioReportsUrl,
}: {
  filters: ExpenseReportFilters;
  /** Null when the report server URL or API key isn't configured. */
  folioReportsUrl: string | null;
}) {
  const getToken = useCallback(() => getExpenseReportToken(filters), [filters]);

  return (
    <main className="flex h-dvh flex-col bg-canvas">
      <h1 className="sr-only">Expense details report</h1>
      {folioReportsUrl ? (
        <FolioReportViewer
          serverUrl={folioReportsUrl}
          report={EXPENSE_REPORT_ID}
          title="Expense details report"
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
