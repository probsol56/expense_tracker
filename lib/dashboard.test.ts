import { describe, expect, it } from "vitest";
import { getMonthRange, parseActivityType, toSearchPattern } from "@/lib/dashboard";

describe("getMonthRange", () => {
  it("spans the first of the month to the first of the next", () => {
    expect(getMonthRange(new Date("2026-09-27T10:00:00Z"))).toEqual({ from: "2026-09-01", to: "2026-10-01" });
  });

  it("rolls December into January of the next year", () => {
    expect(getMonthRange(new Date("2026-12-31T23:59:59Z"))).toEqual({ from: "2026-12-01", to: "2027-01-01" });
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
