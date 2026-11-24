"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Play } from "lucide-react";
import { Alert, Button, Input, Label } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { CategoryMultiSelect, type CategoryOption } from "@/components/category-multi-select";
import { FolioReportViewer } from "@/components/folio-report-viewer";
import { getExpenseReportToken } from "@/app/(app)/reports/expense-details/actions";
import { EXPENSE_REPORT_ID, EXPENSE_REPORT_PARAMS, expenseReportFiltersKey } from "@/lib/expense-report";
import { expenseReportFiltersSchema, type ExpenseReportFilters } from "@/lib/validations";

function toQuery({ categoryIds, fromDate, toDate }: ExpenseReportFilters): string {
  const params = new URLSearchParams({ [EXPENSE_REPORT_PARAMS.from]: fromDate, [EXPENSE_REPORT_PARAMS.to]: toDate });
  if (categoryIds.length > 0) params.set(EXPENSE_REPORT_PARAMS.categories, categoryIds.join(","));
  return params.toString();
}

/**
 * Parameter form + on-demand preview. Editing filters only changes the draft;
 * the report runs when the user asks for it, so the Folio server isn't hit on
 * every page visit or keystroke.
 */
export function ExpenseDetailsContent({
  workspaceName,
  categories,
  filters: initialFilters,
  folioReportsUrl,
}: {
  workspaceName: string;
  categories: CategoryOption[];
  /** Prefill from the URL, so a previewed report can be bookmarked or shared. */
  filters: ExpenseReportFilters;
  /** Null when the report server URL or API key isn't configured. */
  folioReportsUrl: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState<ExpenseReportFilters>(initialFilters);
  const [previewed, setPreviewed] = useState<ExpenseReportFilters | null>(null);

  const validation = expenseReportFiltersSchema.safeParse(draft);
  const draftError = validation.success ? null : (validation.error.issues[0]?.message ?? "Check the report filters.");
  const isStale = previewed !== null && expenseReportFiltersKey(previewed) !== expenseReportFiltersKey(draft);

  const preview = () => {
    if (!validation.success) return;
    setPreviewed(validation.data);
    router.replace(`${pathname}?${toQuery(validation.data)}`, { scroll: false });
  };

  const getToken = useCallback(
    () => (previewed ? getExpenseReportToken(previewed) : Promise.resolve({ error: "Preview the report first." })),
    [previewed],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow={workspaceName}
        title="Expense details"
        description="Expenses by category for a date range. Choose the filters, then preview the report to print or export it."
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
          <form
            className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              preview();
            }}
            noValidate
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="expense-report-categories" className="text-xs uppercase tracking-widest text-fg-muted">
                Categories
              </Label>
              <CategoryMultiSelect
                id="expense-report-categories"
                options={categories}
                value={draft.categoryIds}
                onChange={(categoryIds) => setDraft((current) => ({ ...current, categoryIds }))}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="expense-report-from" className="text-xs uppercase tracking-widest text-fg-muted">From</Label>
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
              <Label htmlFor="expense-report-to" className="text-xs uppercase tracking-widest text-fg-muted">To</Label>
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

            <Button type="submit" variant="primary" disabled={!folioReportsUrl || draftError !== null}>
              <Play aria-hidden="true" />
              Preview report
            </Button>

            {draftError && (
              <p id="expense-report-error" role="alert" className="text-sm font-medium text-brick sm:col-span-2 lg:col-span-4">
                {draftError}
              </p>
            )}
          </form>

          {!folioReportsUrl ? (
            <Alert tone="warning">Reports aren&apos;t configured on this server yet. Set the report server URL and API key, then reload.</Alert>
          ) : previewed ? (
            <>
              {isStale && (
                <Alert tone="warning" className="mb-4">
                  The filters have changed since this preview. Select Preview report to update it.
                </Alert>
              )}
              <FolioReportViewer
                key={expenseReportFiltersKey(previewed)}
                serverUrl={folioReportsUrl}
                report={EXPENSE_REPORT_ID}
                title="Expense details report"
                getToken={getToken}
              />
            </>
          ) : (
            <div className="flex min-h-[20rem] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-rule px-6 py-12 text-center">
              <FileText aria-hidden="true" className="h-8 w-8 text-fg-muted" />
              <p className="font-medium text-fg">No report previewed yet</p>
              <p className="max-w-sm text-sm text-fg-muted">
                Pick the categories and date range, then select Preview report. You can print or export it from the viewer.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
