import { z } from "zod";
import { getSearchParam } from "@/lib/utils";
import type { ReportFilterKind, ReportFilters } from "@/lib/validations";

type CategoryType = "expense" | "income";

/** What a report is filtered by, besides the date range every report takes. */
export type ReportSubject =
  | {
      kind: "categories";
      /** Which categories the picker offers and "all categories" expands to. */
      categoryTypes: readonly CategoryType[];
      /** How the form and errors name a category, e.g. "expense category". */
      noun: string;
    }
  | { kind: "account" };

export interface FolioReportDefinition {
  /** Report id saved in the Folio designer (spelling matches the server). */
  folioId: string;
  title: string;
  /** Shown under the page title on the parameter form. */
  description: string;
  subject: ReportSubject;
}

/**
 * Every Folio report the app offers. They share one parameter form, one viewer
 * route and one token action; `subject` picks the field above the date range.
 * Adding a report is one entry here. Order is the order shown in the sidebar.
 */
export const FOLIO_REPORTS = {
  "account-ledger": {
    folioId: "accountledgerreport",
    title: "Account ledger",
    description:
      "Every transaction in one account for a date range. Choose the filters, then open the report in a new window to print or export it.",
    subject: { kind: "account" },
  },
  "expense-details": {
    folioId: "expense-details",
    title: "Expense details",
    description:
      "Expenses by category for a date range. Choose the filters, then open the report in a new window to print or export it.",
    subject: { kind: "categories", categoryTypes: ["expense"], noun: "expense category" },
  },
} as const satisfies Record<string, FolioReportDefinition>;

export type FolioReportSlug = keyof typeof FOLIO_REPORTS;
export type FolioReport = FolioReportDefinition & { slug: FolioReportSlug };

const FOLIO_REPORT_SLUGS = ["account-ledger", "expense-details"] as const satisfies readonly FolioReportSlug[];
export const folioReportSlugSchema = z.enum(FOLIO_REPORT_SLUGS);

/** Resolves a route segment to a report, or null for anything unknown. */
export function getFolioReport(slug: string): FolioReport | null {
  const parsed = folioReportSlugSchema.safeParse(slug);
  return parsed.success ? { slug: parsed.data, ...FOLIO_REPORTS[parsed.data] } : null;
}

/** In-app parameter form for a report. */
export function reportFormPath(slug: FolioReportSlug): string {
  return `/reports/${slug}`;
}

/** Standalone, full-window viewer route (outside the app shell). */
export function reportViewerPath(slug: FolioReportSlug): string {
  return `/report-viewer/${slug}`;
}

/** URL search-param keys for the report filters. */
export const REPORT_PARAMS = {
  account: "account",
  categories: "categories",
  from: "from",
  to: "to",
} as const;

const uuid = z.string().uuid();
const isoDate = z.string().date();

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Default range: the first of the current month through today. */
export function defaultReportRange(today: Date = new Date()): { fromDate: string; toDate: string } {
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  return { fromDate: toIsoDate(monthStart), toDate: toIsoDate(today) };
}

/**
 * Reads report filters from the URL, dropping anything malformed instead of
 * erroring: a bad date falls back to the default range, a bad id is ignored
 * (a missing account is left empty for the caller to default). The server
 * action still re-validates whatever the client sends.
 */
export function parseReportFilters(
  kind: ReportFilterKind,
  searchParams: Record<string, string | string[] | undefined>,
  today: Date = new Date(),
): ReportFilters {
  const defaults = defaultReportRange(today);
  const rawFrom = getSearchParam(searchParams, REPORT_PARAMS.from);
  const rawTo = getSearchParam(searchParams, REPORT_PARAMS.to);
  let fromDate = isoDate.safeParse(rawFrom).success ? rawFrom : defaults.fromDate;
  let toDate = isoDate.safeParse(rawTo).success ? rawTo : defaults.toDate;
  if (fromDate > toDate) [fromDate, toDate] = [toDate, fromDate];

  if (kind === "account") {
    const rawAccount = getSearchParam(searchParams, REPORT_PARAMS.account).trim();
    return { kind, accountId: uuid.safeParse(rawAccount).success ? rawAccount : "", fromDate, toDate };
  }

  const categoryIds = [
    ...new Set(
      getSearchParam(searchParams, REPORT_PARAMS.categories)
        .split(",")
        .map((id) => id.trim())
        .filter((id) => uuid.safeParse(id).success),
    ),
  ];
  return { kind, categoryIds, fromDate, toDate };
}

/** Serializes filters into the search params `parseReportFilters` reads. */
export function reportQuery(filters: ReportFilters): string {
  const params = new URLSearchParams({ [REPORT_PARAMS.from]: filters.fromDate, [REPORT_PARAMS.to]: filters.toDate });
  if (filters.kind === "account") {
    if (filters.accountId) params.set(REPORT_PARAMS.account, filters.accountId);
  } else if (filters.categoryIds.length > 0) {
    params.set(REPORT_PARAMS.categories, filters.categoryIds.join(","));
  }
  return params.toString();
}
