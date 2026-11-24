import { describe, expect, it } from "vitest";
import {
  defaultExpenseReportRange,
  expenseReportFiltersKey,
  expenseReportQuery,
  parseExpenseReportFilters,
} from "@/lib/expense-report";
import { expenseReportFiltersSchema } from "@/lib/validations";

const TODAY = new Date("2026-11-24T10:00:00Z");
const A = "6f1c2c1e-3a0b-4c55-9a3e-1b2c3d4e5f60";
const B = "0a9b8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d";

describe("defaultExpenseReportRange", () => {
  it("runs from the first of the month to today", () => {
    expect(defaultExpenseReportRange(TODAY)).toEqual({ fromDate: "2026-11-01", toDate: "2026-11-24" });
  });
});

describe("parseExpenseReportFilters", () => {
  it("falls back to the default range with no params", () => {
    expect(parseExpenseReportFilters({}, TODAY)).toEqual({ categoryIds: [], fromDate: "2026-11-01", toDate: "2026-11-24" });
  });

  it("reads dates and comma-separated category ids", () => {
    expect(parseExpenseReportFilters({ from: "2026-01-01", to: "2026-03-31", categories: `${A},${B}` }, TODAY)).toEqual({
      categoryIds: [A, B],
      fromDate: "2026-01-01",
      toDate: "2026-03-31",
    });
  });

  it("drops malformed ids and duplicates", () => {
    expect(parseExpenseReportFilters({ categories: `${A},nope,${A},1;drop table` }, TODAY).categoryIds).toEqual([A]);
  });

  it("replaces invalid dates and swaps a reversed range", () => {
    expect(parseExpenseReportFilters({ from: "2026-13-40", to: "garbage" }, TODAY)).toMatchObject({
      fromDate: "2026-11-01",
      toDate: "2026-11-24",
    });
    expect(parseExpenseReportFilters({ from: "2026-05-01", to: "2026-02-01" }, TODAY)).toMatchObject({
      fromDate: "2026-02-01",
      toDate: "2026-05-01",
    });
  });
});

describe("expenseReportFiltersKey", () => {
  it("ignores category order", () => {
    const base = { fromDate: "2026-01-01", toDate: "2026-01-31" };
    expect(expenseReportFiltersKey({ ...base, categoryIds: [A, B] })).toBe(expenseReportFiltersKey({ ...base, categoryIds: [B, A] }));
  });
});

describe("expenseReportFiltersSchema", () => {
  it("rejects a reversed range and non-uuid ids", () => {
    expect(expenseReportFiltersSchema.safeParse({ categoryIds: [], fromDate: "2026-02-01", toDate: "2026-01-01" }).success).toBe(false);
    expect(expenseReportFiltersSchema.safeParse({ categoryIds: ["x"], fromDate: "2026-01-01", toDate: "2026-01-02" }).success).toBe(false);
  });

  it("accepts a valid filter set", () => {
    expect(expenseReportFiltersSchema.safeParse({ categoryIds: [A], fromDate: "2026-01-01", toDate: "2026-01-01" }).success).toBe(true);
  });
});

describe("expenseReportQuery", () => {
  it("round-trips through parseExpenseReportFilters", () => {
    const filters = { categoryIds: [A, B], fromDate: "2026-10-01", toDate: "2026-10-31" };
    const parsed = parseExpenseReportFilters(Object.fromEntries(new URLSearchParams(expenseReportQuery(filters))), TODAY);
    expect(parsed).toEqual(filters);
  });

  it("omits the categories param when none are selected", () => {
    const query = expenseReportQuery({ categoryIds: [], fromDate: "2026-10-01", toDate: "2026-10-31" });
    expect(new URLSearchParams(query).has("categories")).toBe(false);
  });
});
