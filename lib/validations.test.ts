import { describe, expect, it } from "vitest";
import {
  accountSchema,
  deleteAccountSchema,
  holidaySchema,
  newPasswordSchema,
  passwordResetRequestSchema,
  importSchema,
  loanPaymentSchema,
  loanSchema,
  loanUpdateSchema,
  recurringTransactionSchema,
  transactionSchema,
  transactionReceiptFieldsSchema,
  transferSchema,
} from "@/lib/validations";

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

const ACCOUNT_ID_A = "6f1c1a38-5a7e-4a52-9d3c-1f0e6f3b2a10";
const ACCOUNT_ID_B = "7f1c1a38-5a7e-4a52-9d3c-1f0e6f3b2a11";

describe("accountSchema", () => {
  it("rejects an unknown account type instead of silently defaulting", () => {
    expect(accountSchema.safeParse({ name: "Wallet", account_type: "bitcoin", starting_balance: "0" }).success).toBe(false);
  });

  it("accepts a negative starting balance for a credit card", () => {
    const result = accountSchema.safeParse({ name: "Visa", account_type: "credit_card", starting_balance: "-500" });
    expect(result.success && result.data.starting_balance).toBe(-500);
  });
});

describe("transferSchema", () => {
  const valid = { from_account_id: ACCOUNT_ID_A, to_account_id: ACCOUNT_ID_B, amount: "50", date: "2026-09-26" };

  it("accepts two different accounts", () => {
    expect(transferSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects the same account on both sides", () => {
    expect(transferSchema.safeParse({ ...valid, to_account_id: ACCOUNT_ID_A }).success).toBe(false);
  });
});

describe("loanSchema / loanUpdateSchema", () => {
  const valid = {
    name: "Car loan",
    lender: "Bank",
    principal_amount: "1000",
    date_started: "2026-09-01",
    account_id: ACCOUNT_ID_A,
  };

  it("requires an account on create", () => {
    expect(loanSchema.safeParse({ ...valid, account_id: "" }).success).toBe(false);
  });

  it("allows a blank account on update, for loans predating account tracking", () => {
    expect(loanUpdateSchema.safeParse({ ...valid, account_id: "" }).success).toBe(true);
  });
});

describe("loanPaymentSchema", () => {
  it("rejects a zero payment", () => {
    expect(
      loanPaymentSchema.safeParse({ loan_id: ACCOUNT_ID_A, amount: "0", date: "2026-09-26", account_id: ACCOUNT_ID_B }).success,
    ).toBe(false);
  });
});

describe("importSchema", () => {
  it("requires a uuid bank account", () => {
    expect(importSchema.safeParse({ bank_account_id: "not-a-uuid" }).success).toBe(false);
  });
});

describe("auth schemas", () => {
  it("requires a valid email for a reset request", () => {
    expect(passwordResetRequestSchema.safeParse({ email: " a@b.co " }).success).toBe(true);
    expect(passwordResetRequestSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("enforces password length and matching confirmation", () => {
    expect(newPasswordSchema.safeParse({ password: "longenough", confirm_password: "longenough" }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: "short", confirm_password: "short" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "x".repeat(73), confirm_password: "x".repeat(73) }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "longenough", confirm_password: "different1" }).success).toBe(false);
  });

  it("only accepts the exact delete confirmation word", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: "DELETE" }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirmation: "delete" }).success).toBe(false);
  });
});

describe("transactionReceiptFieldsSchema", () => {
  const WORKSPACE_ID = "6f1c1a38-5a7e-4a52-9d3c-1f0e6f3b2a10";
  const FILE_ID = "0b6e2f0c-3d4a-4f7e-8a51-2c9d7e1f4b33";
  const CONTENT_HASH = "a".repeat(64);

  it("treats blank or missing fields as null", () => {
    expect(transactionReceiptFieldsSchema.parse({ tax_amount: "", discount_amount: "" })).toEqual({
      tax_amount: null,
      discount_amount: null,
      receipt_path: null,
    });
  });

  it("coerces amounts and accepts a workspace receipt path", () => {
    expect(
      transactionReceiptFieldsSchema.parse({
        tax_amount: "15.5",
        discount_amount: "0",
        receipt_path: `${WORKSPACE_ID}/${FILE_ID}.jpg`,
      }),
    ).toEqual({ tax_amount: 15.5, discount_amount: 0, receipt_path: `${WORKSPACE_ID}/${FILE_ID}.jpg` });
  });

  it("accepts a content-hashed receipt path", () => {
    const receipt_path = `${WORKSPACE_ID}/${CONTENT_HASH}.pdf`;
    expect(transactionReceiptFieldsSchema.parse({ receipt_path }).receipt_path).toBe(receipt_path);
  });

  it("rejects negative amounts", () => {
    expect(transactionReceiptFieldsSchema.safeParse({ tax_amount: "-1" }).success).toBe(false);
  });

  it.each([
    [`../${FILE_ID}.jpg`],
    [`${WORKSPACE_ID}/${FILE_ID}.exe`],
    [`${WORKSPACE_ID}/${FILE_ID}xjpg`],
    [`${WORKSPACE_ID}/nested/${FILE_ID}.jpg`],
    [`${WORKSPACE_ID}/${CONTENT_HASH.slice(1)}.jpg`],
    [`${WORKSPACE_ID}/${CONTENT_HASH.toUpperCase()}.jpg`],
  ])("rejects receipt path %s", (receipt_path) => {
    expect(transactionReceiptFieldsSchema.safeParse({ receipt_path }).success).toBe(false);
  });
});
