"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Alert, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { CategoryMultiSelect } from "@/components/category-multi-select";
import { reportQuery, reportViewerPath, type FolioReport } from "@/lib/folio-reports";
import { reportFiltersSchema, type ReportFilters } from "@/lib/validations";

const labelClass = "text-xs uppercase tracking-widest text-fg-muted";

export interface ReportOption {
  id: string;
  name: string;
}

/** Shown instead of the form when the workspace has nothing to pick. */
function EmptySubjectNotice({ report }: { report: FolioReport }) {
  const { subject } = report;
  const [message, href, action] =
    subject.kind === "account"
      ? ["This report shows one account, and this workspace doesn't have any accounts yet.", "/accounts", "Add an account"]
      : [`This report filters by ${subject.noun}, and this workspace doesn't have any yet.`, "/categories", "Add a category"];
  return (
    <Alert tone="info" className="flex flex-wrap items-center justify-between gap-3">
      <span>{message}</span>
      <Button asChild variant="outline" size="sm">
        <Link href={href}>{action}</Link>
      </Button>
    </Alert>
  );
}

/**
 * Parameter form shared by every Folio report: the report's subject (one
 * account, or any number of categories) plus a date range. The report opens in
 * its own window (a full-screen viewer route) so it isn't squeezed beside the
 * sidebar; the Folio server is only hit when the user asks for the report.
 */
export function ReportParametersForm({
  report,
  workspaceName,
  options,
  filters: initialFilters,
  folioReportsUrl,
}: {
  report: FolioReport;
  workspaceName: string;
  /** Accounts or categories, matching the report's subject. */
  options: ReportOption[];
  /** Prefill from the URL, so the last-run filters survive a reload or bookmark. */
  filters: ReportFilters;
  /** Null when the report server URL or API key isn't configured. */
  folioReportsUrl: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const fieldId = useId();
  const [draft, setDraft] = useState<ReportFilters>(initialFilters);

  const validation = reportFiltersSchema.safeParse(draft);
  const draftError = validation.success ? null : (validation.error.issues[0]?.message ?? "Check the report filters.");
  const errorId = `${fieldId}-error`;
  const subjectId = `${fieldId}-subject`;

  const openReport = () => {
    if (!validation.success) return;
    const query = reportQuery(validation.data);
    // Must run synchronously inside the submit gesture, or popup blockers step in.
    window.open(`${reportViewerPath(report.slug)}?${query}`, "_blank", "noopener");
    router.replace(`${pathname}?${query}`, { scroll: false });
  };

  const subjectField =
    draft.kind === "account" ? (
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={subjectId} className={labelClass}>
          Account
        </Label>
        <Select
          value={draft.accountId || undefined}
          onValueChange={(accountId) => setDraft({ ...draft, accountId })}
        >
          <SelectTrigger id={subjectId}>
            <SelectValue placeholder="Choose an account" />
          </SelectTrigger>
          <SelectContent>
            {options.map(({ id, name }) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ) : (
      <div className="flex min-w-0 flex-col gap-1.5">
        <Label htmlFor={subjectId} className={labelClass}>
          Categories
        </Label>
        <CategoryMultiSelect
          id={subjectId}
          options={options}
          value={draft.categoryIds}
          onChange={(categoryIds) => setDraft({ ...draft, categoryIds })}
        />
        <p className="text-xs text-fg-muted">
          Leave empty to include every {report.subject.kind === "categories" ? report.subject.noun : "category"}.
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow={workspaceName} title={report.title} description={report.description} />

      {options.length === 0 ? (
        <EmptySubjectNotice report={report} />
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
            {subjectField}

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={`${fieldId}-from`} className={labelClass}>From</Label>
              <Input
                id={`${fieldId}-from`}
                type="date"
                required
                value={draft.fromDate}
                max={draft.toDate || undefined}
                onChange={(e) => setDraft((current) => ({ ...current, fromDate: e.target.value }))}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={`${fieldId}-to`} className={labelClass}>To</Label>
              <Input
                id={`${fieldId}-to`}
                type="date"
                required
                value={draft.toDate}
                min={draft.fromDate || undefined}
                aria-invalid={draftError ? true : undefined}
                aria-describedby={draftError ? errorId : undefined}
                onChange={(e) => setDraft((current) => ({ ...current, toDate: e.target.value }))}
              />
            </div>

            {draftError && (
              <p id={errorId} role="alert" className="text-sm font-medium text-brick">
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
