"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Alert, Button, Input, Label } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { CategoryMultiSelect, type CategoryOption } from "@/components/category-multi-select";
import { EXPENSE_REPORT_VIEWER_PATH, expenseReportQuery } from "@/lib/expense-report";
import { expenseReportFiltersSchema, type ExpenseReportFilters } from "@/lib/validations";

const labelClass = "text-xs uppercase tracking-widest text-fg-muted";

/**
 * Parameter form. The report opens in its own window (a full-screen viewer
 * route) so it isn't squeezed beside the sidebar; the Folio server is only hit
 * when the user asks for the report.
 */
export function ExpenseDetailsContent({
  workspaceName,
  categories,
  filters: initialFilters,
  folioReportsUrl,
}: {
  workspaceName: string;
  categories: CategoryOption[];
  /** Prefill from the URL, so the last-run filters survive a reload or bookmark. */
  filters: ExpenseReportFilters;
  /** Null when the report server URL or API key isn't configured. */
  folioReportsUrl: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState<ExpenseReportFilters>(initialFilters);

  const validation = expenseReportFiltersSchema.safeParse(draft);
  const draftError = validation.success ? null : (validation.error.issues[0]?.message ?? "Check the report filters.");

  const openReport = () => {
    if (!validation.success) return;
    const query = expenseReportQuery(validation.data);
    // Must run synchronously inside the submit gesture, or popup blockers step in.
    window.open(`${EXPENSE_REPORT_VIEWER_PATH}?${query}`, "_blank", "noopener");
    router.replace(`${pathname}?${query}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={workspaceName}
        title="Expense details"
        description="Expenses by category for a date range. Choose the filters, then open the report in a new window to print or export it."
      />

      {categories.length === 0 ? (
        <Alert tone="info" className="flex flex-wrap items-center justify-between gap-3">
          <span>This report groups expenses by category, and this workspace doesn&apos;t have any expense categories yet.</span>
          <Button asChild variant="outline" size="sm">
            <Link href="/categories">Add a category</Link>
          </Button>
        </Alert>
      ) : (
        <>
          {!folioReportsUrl && (
            <Alert tone="warning" className="mb-6">
              Reports aren&apos;t configured on this server yet. Set the report server URL and API key, then reload.
            </Alert>
          )}

          <form
            className="flex max-w-xl flex-col gap-5 rounded-lg border border-rule bg-paper p-5 sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              openReport();
            }}
            noValidate
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="expense-report-categories" className={labelClass}>
                Categories
              </Label>
              <CategoryMultiSelect
                id="expense-report-categories"
                options={categories}
                value={draft.categoryIds}
                onChange={(categoryIds) => setDraft((current) => ({ ...current, categoryIds }))}
              />
              <p className="text-xs text-fg-muted">Leave empty to include every expense category.</p>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="expense-report-from" className={labelClass}>From</Label>
              <Input
                id="expense-report-from"
                type="date"
                required
                value={draft.fromDate}
                max={draft.toDate || undefined}
                onChange={(e) => setDraft((current) => ({ ...current, fromDate: e.target.value }))}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="expense-report-to" className={labelClass}>To</Label>
              <Input
                id="expense-report-to"
                type="date"
                required
                value={draft.toDate}
                min={draft.fromDate || undefined}
                aria-invalid={draftError ? true : undefined}
                aria-describedby={draftError ? "expense-report-error" : undefined}
                onChange={(e) => setDraft((current) => ({ ...current, toDate: e.target.value }))}
              />
            </div>

            {draftError && (
              <p id="expense-report-error" role="alert" className="text-sm font-medium text-brick">
                {draftError}
              </p>
            )}

            <div className="flex justify-end border-t border-rule pt-5">
              <Button type="submit" variant="primary" disabled={!folioReportsUrl || draftError !== null}>
                <ExternalLink aria-hidden="true" />
                Open report
                <span className="sr-only"> (opens in a new window)</span>
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
