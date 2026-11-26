import { describe, expect, it } from "vitest";
import {
  FOLIO_REPORTS,
  defaultReportRange,
  folioReportSlugSchema,
  getFolioReport,
  parseReportFilters,
  reportQuery,
} from "@/lib/folio-reports";
import { reportFiltersSchema, type ReportFilters } from "@/lib/validations";

const TODAY = new Date("2026-11-24T10:00:00Z");
const A = "6f1c2c1e-3a0b-4c55-9a3e-1b2c3d4e5f60";
const B = "0a9b8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d";

describe("getFolioReport", () => {
  it("knows every registered report", () => {
    expect([...folioReportSlugSchema.options].sort()).toEqual(Object.keys(FOLIO_REPORTS).sort());
  });

  it("resolves known slugs to their Folio report id and subject", () => {
    expect(getFolioReport("account-ledger")).toMatchObject({ folioId: "AccountLedgerReport", subject: { kind: "account" } });
    expect(getFolioReport("expense-details")).toMatchObject({ folioId: "expense-details", subject: { kind: "categories" } });
  });

  it("returns null for unknown or inherited keys", () => {
    expect(getFolioReport("nope")).toBeNull();
    expect(getFolioReport("toString")).toBeNull();
  });
});

describe("defaultReportRange", () => {
  it("runs from the first of the month to today", () => {
    expect(defaultReportRange(TODAY)).toEqual({ fromDate: "2026-11-01", toDate: "2026-11-24" });
  });
});

describe("parseReportFilters (categories)", () => {
  it("falls back to the default range with no params", () => {
    expect(parseReportFilters("categories", {}, TODAY)).toEqual({
      kind: "categories",
      categoryIds: [],
      fromDate: "2026-11-01",
      toDate: "2026-11-24",
    });
  });

  it("reads dates and comma-separated category ids", () => {
    expect(parseReportFilters("categories", { from: "2026-01-01", to: "2026-03-31", categories: `${A},${B}` }, TODAY)).toEqual({
      kind: "categories",
      categoryIds: [A, B],
      fromDate: "2026-01-01",
      toDate: "2026-03-31",
    });
  });

  it("drops malformed ids and duplicates", () => {
    expect(parseReportFilters("categories", { categories: `${A},nope,${A},1;drop table` }, TODAY)).toMatchObject({
      categoryIds: [A],
    });
  });

  it("replaces invalid dates and swaps a reversed range", () => {
    expect(parseReportFilters("categories", { from: "2026-13-40", to: "garbage" }, TODAY)).toMatchObject({
      fromDate: "2026-11-01",
      toDate: "2026-11-24",
    });
    expect(parseReportFilters("categories", { from: "2026-05-01", to: "2026-02-01" }, TODAY)).toMatchObject({
      fromDate: "2026-02-01",
      toDate: "2026-05-01",
    });
  });
});

describe("parseReportFilters (account)", () => {
  it("reads a single account id", () => {
    expect(parseReportFilters("account", { account: A, from: "2026-01-01", to: "2026-01-31" }, TODAY)).toEqual({
      kind: "account",
      accountId: A,
      fromDate: "2026-01-01",
      toDate: "2026-01-31",
    });
  });

  it("leaves a missing or malformed account empty and ignores categories", () => {
    expect(parseReportFilters("account", { account: "nope", categories: A }, TODAY)).toEqual({
      kind: "account",
      accountId: "",
      fromDate: "2026-11-01",
      toDate: "2026-11-24",
    });
  });
});

describe("reportFiltersSchema", () => {
  it("rejects a reversed range and non-uuid ids", () => {
    expect(reportFiltersSchema.safeParse({ kind: "categories", categoryIds: [], fromDate: "2026-02-01", toDate: "2026-01-01" }).success).toBe(false);
    expect(reportFiltersSchema.safeParse({ kind: "categories", categoryIds: ["x"], fromDate: "2026-01-01", toDate: "2026-01-02" }).success).toBe(false);
  });

  it("requires exactly one valid account for the account kind", () => {
    expect(reportFiltersSchema.safeParse({ kind: "account", accountId: "", fromDate: "2026-01-01", toDate: "2026-01-02" }).success).toBe(false);
    expect(reportFiltersSchema.safeParse({ kind: "account", accountId: [A, B], fromDate: "2026-01-01", toDate: "2026-01-02" }).success).toBe(false);
    expect(reportFiltersSchema.safeParse({ kind: "account", accountId: A, fromDate: "2026-01-01", toDate: "2026-01-02" }).success).toBe(true);
  });

  it("accepts a valid category filter set", () => {
    expect(reportFiltersSchema.safeParse({ kind: "categories", categoryIds: [A], fromDate: "2026-01-01", toDate: "2026-01-01" }).success).toBe(true);
  });
});

describe("reportQuery", () => {
  it.each<ReportFilters>([
    { kind: "categories", categoryIds: [A, B], fromDate: "2026-10-01", toDate: "2026-10-31" },
    { kind: "account", accountId: A, fromDate: "2026-10-01", toDate: "2026-10-31" },
  ])("round-trips $kind filters through parseReportFilters", (filters) => {
    const parsed = parseReportFilters(filters.kind, Object.fromEntries(new URLSearchParams(reportQuery(filters))), TODAY);
    expect(parsed).toEqual(filters);
  });

  it("omits the categories param when none are selected", () => {
    const query = reportQuery({ kind: "categories", categoryIds: [], fromDate: "2026-10-01", toDate: "2026-10-31" });
    expect(new URLSearchParams(query).has("categories")).toBe(false);
  });
});
