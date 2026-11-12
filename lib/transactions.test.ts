import { describe, expect, it } from "vitest";
import { toTransaction } from "@/lib/transactions";

describe("toTransaction", () => {
  it("preserves the linked loan id for loan ledger entries", () => {
    const transaction = toTransaction({
      id: "transaction-id",
      loan_id: "loan-id",
      amount: 125,
      date: "2026-11-12",
    });

    expect(transaction.loan_id).toBe("loan-id");
  });
});
