import { describe, expect, it } from "vitest";
import { parseTransactionSortOrder } from "@/lib/transaction-sort";

describe("parseTransactionSortOrder", () => {
  it("accepts ascending and descending values", () => {
    expect(parseTransactionSortOrder("asc")).toBe("asc");
    expect(parseTransactionSortOrder("desc")).toBe("desc");
  });

  it("defaults invalid or missing values to descending", () => {
    expect(parseTransactionSortOrder(undefined)).toBe("desc");
    expect(parseTransactionSortOrder("invalid")).toBe("desc");
  });
});
