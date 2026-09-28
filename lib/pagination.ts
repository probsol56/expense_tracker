import type { PostgrestError } from "@supabase/supabase-js";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/** Fixed page size for the management lists (transfers, loans, merchants, recurring, holidays). */
export const LIST_PAGE_SIZE = 20;

/** Merchants render as compact chips, so a page holds more of them. */
export const MERCHANT_PAGE_SIZE = 60;

/** Repayments shown under each loan card; the full history is not loaded. */
export const RECENT_REPAYMENTS_PER_LOAN = 5;

// Lists that feed a <select> or datalist can't be paged without breaking the
// picker, so they get a hard ceiling instead. Well above realistic use; past
// it, the picker needs server-side search rather than a bigger number here.
export const PICKER_LIMITS = {
  accounts: 200,
  categories: 500,
  merchants: 500,
  loans: 200,
} as const;

export function clampPageSize(value: number): number {
  if (!Number.isFinite(value) || value < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

export function parsePage(value: string): number {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

export function pageRange(page: number, pageSize: number): [number, number] {
  const start = (Math.max(1, page) - 1) * pageSize;
  return [start, start + pageSize - 1];
}

export function totalPagesFor(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

export type Page<Row> = {
  rows: Row[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
};

export type PageInfo = Omit<Page<unknown>, "rows">;

/** Strips the rows so only the counters cross the server → client boundary. */
export function pageInfo<Row>({ page, pageSize, totalPages, totalCount }: Page<Row>): PageInfo {
  return { page, pageSize, totalPages, totalCount };
}

type RangeableQuery<Row> = {
  range(
    from: number,
    to: number,
  ): PromiseLike<{ data: Row[] | null; count: number | null; error: PostgrestError | null }>;
};

/**
 * Fetches one page with `count: "exact"`. `buildQuery` must select with
 * `{ count: "exact" }` and apply a stable order. A page past the end (stale
 * link, rows deleted since) is clamped to the last page with one refetch.
 */
export async function fetchPage<Row>(
  buildQuery: () => RangeableQuery<Row>,
  page: number,
  pageSize: number,
): Promise<Page<Row>> {
  const first = await buildQuery().range(...pageRange(page, pageSize));
  if (first.error) throw first.error;

  const totalCount = first.count ?? 0;
  const totalPages = totalPagesFor(totalCount, pageSize);
  if (page <= totalPages) {
    return { rows: first.data ?? [], page, pageSize, totalPages, totalCount };
  }

  const clamped = await buildQuery().range(...pageRange(totalPages, pageSize));
  if (clamped.error) throw clamped.error;
  const clampedCount = clamped.count ?? totalCount;
  return {
    rows: clamped.data ?? [],
    page: totalPages,
    pageSize,
    totalPages: totalPagesFor(clampedCount, pageSize),
    totalCount: clampedCount,
  };
}
