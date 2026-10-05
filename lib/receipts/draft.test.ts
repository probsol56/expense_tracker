import { describe, expect, it } from "vitest";
import { RECEIPT_WARNINGS, toReceiptDraft } from "@/lib/receipts/draft";
import { parseExtractedReceipt, type ExtractedReceipt } from "@/lib/receipts/schema";

function receipt(overrides: Partial<ExtractedReceipt> = {}): ExtractedReceipt {
  return {
    merchant: "Shwapno",
    date: "2026-10-01",
    currency: "BDT",
    subtotal: 300,
    tax: 15,
    discount: 5,
    total: 310,
    suggested_category: "Groceries",
    items: [
      { name: "Rice 5kg", quantity: 1, unit_price: 200, total_price: 200 },
      { name: "চা পাতা", quantity: 2, unit_price: 50, total_price: 100 },
    ],
    ...overrides,
  };
}

describe("parseExtractedReceipt", () => {
  it("rejects non-object payloads", () => {
    expect(parseExtractedReceipt(null)).toBeNull();
    expect(parseExtractedReceipt([])).toBeNull();
    expect(parseExtractedReceipt("receipt")).toBeNull();
  });

  it("nulls out unreadable header fields instead of failing", () => {
    const parsed = parseExtractedReceipt({ ...receipt(), date: "2026-13-45", total: -10, currency: "Tk" });
    expect(parsed?.date).toBeNull();
    expect(parsed?.total).toBeNull();
    expect(parsed?.currency).toBeNull();
    expect(parsed?.merchant).toBe("Shwapno");
  });

  it("drops malformed items but keeps the rest", () => {
    const parsed = parseExtractedReceipt({
      ...receipt(),
      items: [{ name: "", total_price: 5 }, "junk", { name: "Milk", quantity: 1, unit_price: 90, total_price: 90 }],
    });
    expect(parsed?.items).toEqual([{ name: "Milk", quantity: 1, unit_price: 90, total_price: 90 }]);
  });

  it("treats missing fields as null", () => {
    expect(parseExtractedReceipt({ items: [] })).toMatchObject({ merchant: null, total: null, items: [] });
  });
});

describe("toReceiptDraft", () => {
  it("passes a consistent receipt through without warnings", () => {
    const draft = toReceiptDraft(receipt(), "BDT");
    expect(draft).toMatchObject({ amount: 310, tax_amount: 15, discount_amount: 5, category: "Groceries" });
    expect(draft.items).toHaveLength(2);
    expect(draft.warnings).toEqual([]);
  });

  it("fills a missing total or unit price from the other", () => {
    const draft = toReceiptDraft(
      receipt({
        items: [
          { name: "Eggs", quantity: 12, unit_price: 12.5, total_price: null },
          { name: "Oil", quantity: 2, unit_price: null, total_price: 340 },
        ],
        tax: null,
        discount: null,
        total: 490,
      }),
      "BDT",
    );
    expect(draft.items).toEqual([
      { name: "Eggs", quantity: 12, unit_price: 12.5, total_price: 150 },
      { name: "Oil", quantity: 2, unit_price: 170, total_price: 340 },
    ]);
    expect(draft.warnings).toEqual([]);
  });

  it("defaults quantity to 1 and drops items with no price", () => {
    const draft = toReceiptDraft(
      receipt({
        items: [
          { name: "Bread", quantity: null, unit_price: 60, total_price: null },
          { name: "???", quantity: 1, unit_price: null, total_price: null },
        ],
        tax: null,
        discount: null,
        total: 60,
      }),
      "BDT",
    );
    expect(draft.items).toEqual([{ name: "Bread", quantity: 1, unit_price: 60, total_price: 60 }]);
    expect(draft.warnings).toEqual([RECEIPT_WARNINGS.droppedItems]);
  });

  it("flags items that don't add up to the total", () => {
    expect(toReceiptDraft(receipt({ total: 400 }), "BDT").warnings).toContain(RECEIPT_WARNINGS.totalMismatch);
  });

  it("ignores sub-cent rounding differences", () => {
    expect(toReceiptDraft(receipt({ total: 310.004 }), "BDT").warnings).toEqual([]);
  });

  it("computes the amount when the total is unreadable", () => {
    const draft = toReceiptDraft(receipt({ total: null }), "BDT");
    expect(draft.amount).toBe(310);
    expect(draft.warnings).toEqual([RECEIPT_WARNINGS.noTotal]);
  });

  it("leaves the amount empty when nothing is readable", () => {
    const draft = toReceiptDraft(receipt({ total: null, items: [] }), "BDT");
    expect(draft.amount).toBeNull();
    expect(draft.warnings).toEqual([RECEIPT_WARNINGS.noItems, RECEIPT_WARNINGS.noTotal]);
  });

  it("warns about a foreign currency without converting", () => {
    const draft = toReceiptDraft(receipt({ currency: "USD" }), "BDT");
    expect(draft.amount).toBe(310);
    expect(draft.warnings).toEqual([RECEIPT_WARNINGS.currencyMismatch("USD", "BDT")]);
  });

  it("warns when the date is missing", () => {
    expect(toReceiptDraft(receipt({ date: null }), "BDT").warnings).toEqual([RECEIPT_WARNINGS.noDate]);
  });
});
