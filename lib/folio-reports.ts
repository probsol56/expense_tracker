import { z } from "zod";
import { getSearchParam } from "@/lib/utils";
import type { ExpenseReportFilters } from "@/lib/validations";

/** Report id saved in the Folio designer (spelling matches the server). */
export const EXPENSE_REPORT_ID = "expence-details";

/** URL search-param keys for the report filters. */
export const EXPENSE_REPORT_PARAMS = {
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
export function defaultExpenseReportRange(today: Date = new Date()): { fromDate: string; toDate: string } {
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  return { fromDate: toIsoDate(monthStart), toDate: toIsoDate(today) };
}

/**
 * Reads report filters from the URL, dropping anything malformed instead of
 * erroring: a bad date falls back to the default range, a bad id is ignored.
 * The server action still re-validates whatever the client sends.
 */
export function parseExpenseReportFilters(
  searchParams: Record<string, string | string[] | undefined>,
  today: Date = new Date(),
): ExpenseReportFilters {
  const defaults = defaultExpenseReportRange(today);
  const rawFrom = getSearchParam(searchParams, EXPENSE_REPORT_PARAMS.from);
  const rawTo = getSearchParam(searchParams, EXPENSE_REPORT_PARAMS.to);
  let fromDate = isoDate.safeParse(rawFrom).success ? rawFrom : defaults.fromDate;
  let toDate = isoDate.safeParse(rawTo).success ? rawTo : defaults.toDate;
  if (fromDate > toDate) [fromDate, toDate] = [toDate, fromDate];

  const categoryIds = [
    ...new Set(
      getSearchParam(searchParams, EXPENSE_REPORT_PARAMS.categories)
        .split(",")
        .map((id) => id.trim())
        .filter((id) => uuid.safeParse(id).success),
    ),
  ];

  return { categoryIds, fromDate, toDate };
}

/** Stable key for a filter set — changes whenever the viewer must reload. */
export function expenseReportFiltersKey({ categoryIds, fromDate, toDate }: ExpenseReportFilters): string {
  return [fromDate, toDate, [...categoryIds].sort().join(",")].join("|");
}

/** Serializes filters into the search params `parseExpenseReportFilters` reads. */
export function expenseReportQuery({ categoryIds, fromDate, toDate }: ExpenseReportFilters): string {
  const params = new URLSearchParams({ [EXPENSE_REPORT_PARAMS.from]: fromDate, [EXPENSE_REPORT_PARAMS.to]: toDate });
  if (categoryIds.length > 0) params.set(EXPENSE_REPORT_PARAMS.categories, categoryIds.join(","));
  return params.toString();
}

/** Standalone, full-window viewer route (outside the app shell). */
export const EXPENSE_REPORT_VIEWER_PATH = "/report-viewer/expense-details";
