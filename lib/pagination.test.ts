import { describe, expect, it } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, clampPageSize, fetchPage, pageRange, parsePage, totalPagesFor } from "@/lib/pagination";

function fakeTable(total: number) {
  const rows = Array.from({ length: total }, (_, index) => index);
  const calls: Array<[number, number]> = [];
  const buildQuery = () => ({
    range: async (from: number, to: number) => {
      calls.push([from, to]);
      return { data: rows.slice(from, to + 1), count: total, error: null };
    },
  });
  return { buildQuery, calls };
}

describe("clampPageSize", () => {
  it("falls back to the default for invalid values", () => {
    expect(clampPageSize(Number.NaN)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize(0)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize(-5)).toBe(DEFAULT_PAGE_SIZE);
  });

  it("caps oversized requests", () => {
    expect(clampPageSize(100000)).toBe(MAX_PAGE_SIZE);
  });

  it("keeps valid sizes", () => {
    expect(clampPageSize(25)).toBe(25);
  });
});

describe("parsePage", () => {
  it("defaults missing, invalid and non-positive values to 1", () => {
    expect(parsePage("")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
  });

  it("floors fractional pages", () => {
    expect(parsePage("2.7")).toBe(2);
  });
});

describe("pageRange / totalPagesFor", () => {
  it("maps a 1-based page to an inclusive row range", () => {
    expect(pageRange(1, 20)).toEqual([0, 19]);
    expect(pageRange(3, 20)).toEqual([40, 59]);
  });

  it("never reports zero pages", () => {
    expect(totalPagesFor(0, 20)).toBe(1);
    expect(totalPagesFor(41, 20)).toBe(3);
  });
});

describe("fetchPage", () => {
  it("returns the requested page with one query", async () => {
    const { buildQuery, calls } = fakeTable(45);
    const result = await fetchPage(buildQuery, 2, 20);
    expect(result).toMatchObject({ page: 2, totalPages: 3, totalCount: 45 });
    expect(result.rows).toHaveLength(20);
    expect(calls).toEqual([[20, 39]]);
  });

  it("clamps a page past the end to the last page", async () => {
    const { buildQuery, calls } = fakeTable(45);
    const result = await fetchPage(buildQuery, 9, 20);
    expect(result.page).toBe(3);
    expect(result.rows).toEqual([40, 41, 42, 43, 44]);
    expect(calls).toHaveLength(2);
  });

  it("throws instead of rendering an empty list when the query fails", async () => {
    const error: PostgrestError = { code: "42501", message: "denied", details: "", hint: "", name: "PostgrestError", toJSON: () => ({ code: "42501", message: "denied", details: "", hint: "", name: "PostgrestError" }) };
    const buildQuery = () => ({ range: async () => ({ data: null, count: null, error }) });
    await expect(fetchPage(buildQuery, 1, 20)).rejects.toBe(error);
  });
});
