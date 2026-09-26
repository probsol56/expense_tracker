import { describe, expect, it } from "vitest";
import { holidaySchema, recurringTransactionSchema, transactionSchema } from "@/lib/validations";

const ACCOUNT_ID = "6f1c1a38-5a7e-4a52-9d3c-1f0e6f3b2a10";

describe("transactionSchema", () => {
  const valid = {
    merchant: " Cafe ",
    amount: "12.50",
    category: "Food",
    date: "2026-09-26",
    account_id: ACCOUNT_ID,
  };

  it("trims strings and coerces amount", () => {
    const parsed = transactionSchema.parse(valid);
    expect(parsed.merchant).toBe("Cafe");
    expect(parsed.amount).toBe(12.5);
  });

  it.each([["0"], ["-5"], ["abc"]])("rejects amount %s", (amount) => {
    expect(transactionSchema.safeParse({ ...valid, amount }).success).toBe(false);
  });

  it("rejects a non-uuid account", () => {
    expect(transactionSchema.safeParse({ ...valid, account_id: "nope" }).success).toBe(false);
  });
});

describe("recurringTransactionSchema", () => {
  const base = {
    type: "expense",
    merchant: "Rent",
    category: "Housing",
    amount: 500,
    account_id: ACCOUNT_ID,
    skip_holidays: false,
    start_date: "2026-10-01",
  } as const;

  it("requires weekdays for weekly rules", () => {
    expect(recurringTransactionSchema.safeParse({ ...base, frequency: "weekly" }).success).toBe(false);
  });

  it("requires day_of_month for monthly rules", () => {
    expect(recurringTransactionSchema.safeParse({ ...base, frequency: "monthly" }).success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const result = recurringTransactionSchema.safeParse({
      ...base,
      frequency: "daily",
      end_date: "2026-09-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid monthly rule", () => {
    const result = recurringTransactionSchema.safeParse({ ...base, frequency: "monthly", day_of_month: 1 });
    expect(result.success).toBe(true);
  });
});

describe("holidaySchema", () => {
  it("requires a name", () => {
    expect(holidaySchema.safeParse({ date: "2026-12-16", name: " " }).success).toBe(false);
  });
});
