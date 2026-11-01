import { describe, expect, it } from "vitest";
import {
  getMonthRange,
  getMonthRangeForKey,
  parseActivityType,
  parseSpendingMonth,
  toSearchPattern,
} from "@/lib/dashboard";
import { formatSpendingMonth, getCategorySpendingBreakdown, shiftSpendingMonth } from "@/lib/dashboard-month";

describe("getMonthRange", () => {
  it("spans the first of the month to the first of the next", () => {
    expect(getMonthRange(new Date("2026-09-27T10:00:00Z"))).toEqual({ from: "2026-09-01", to: "2026-10-01" });
  });

  it("rolls December into January of the next year", () => {
    expect(getMonthRange(new Date("2026-12-31T23:59:59Z"))).toEqual({ from: "2026-12-01", to: "2027-01-01" });
  });
});

describe("spending month helpers", () => {
  const now = new Date("2026-09-27T10:00:00Z");

  it("uses a valid selected month and defaults invalid or future months to the current month", () => {
    expect(parseSpendingMonth("2026-02", now)).toBe("2026-02");
    expect(parseSpendingMonth("2026-13", now)).toBe("2026-09");
    expect(parseSpendingMonth("2026-10", now)).toBe("2026-09");
    expect(parseSpendingMonth("not-a-month", now)).toBe("2026-09");
  });

  it("gets the selected month range and rolls over at year-end", () => {
    expect(getMonthRangeForKey("2026-09")).toEqual({ from: "2026-09-01", to: "2026-10-01" });
    expect(getMonthRangeForKey("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" });
  });

  it("formats and shifts selected months across years", () => {
    expect(formatSpendingMonth("2026-09")).toBe("September 2026");
    expect(shiftSpendingMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftSpendingMonth("2026-12", 1)).toBe("2027-01");
  });
});

describe("getCategorySpendingBreakdown", () => {
  it("keeps up to five categories unchanged", () => {
    const categories = [
      { category_id: "one", category_name: "Food", amount: 40 },
      { category_id: "two", category_name: "Transport", amount: 25 },
    ];
    expect(getCategorySpendingBreakdown(categories)).toEqual({ chartCategories: categories, otherCategories: [] });
  });

  it("groups categories after the top five and keeps their breakdown available", () => {
    const categories = Array.from({ length: 7 }, (_, index) => ({
      category_id: String(index),
      category_name: `Category ${index + 1}`,
      amount: 100 - index * 10,
    }));

    expect(getCategorySpendingBreakdown(categories)).toEqual({
      chartCategories: [
        ...categories.slice(0, 5),
        { category_id: null, category_name: "Other categories", amount: 90, isOther: true },
      ],
      otherCategories: categories.slice(5),
    });
  });
});

describe("parseActivityType", () => {
  it("accepts known types", () => {
    expect(parseActivityType("transfer")).toBe("transfer");
    expect(parseActivityType("expenses")).toBe("expenses");
  });

  it("falls back to all for anything else", () => {
    expect(parseActivityType("drop table")).toBe("all");
    expect(parseActivityType("")).toBe("all");
  });
});

describe("toSearchPattern", () => {
  it("wraps the term for a contains match", () => {
    expect(toSearchPattern("coffee")).toBe("%coffee%");
  });

  it("strips characters that break the or() filter or act as wildcards", () => {
    expect(toSearchPattern("a,b)(c%d_e*")).toBe("%a b  c d e%");
  });
});
