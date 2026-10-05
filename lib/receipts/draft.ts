import type { ExtractedReceipt } from "@/lib/receipts/schema";

/** What the transaction form is pre-filled with. Every value is a suggestion for the user to review. */
export type ReceiptDraft = {
  merchant: string | null;
  date: string | null;
  category: string | null;
  amount: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  items: { name: string; quantity: number; unit_price: number; total_price: number }[];
  warnings: string[];
};

// Receipts print 2-decimal totals; anything within this is rounding noise.
const TOTAL_TOLERANCE = 0.01;

export const RECEIPT_WARNINGS = {
  noItems: "No line items were found. Add them manually or try a clearer photo.",
  droppedItems: "Some lines had no readable price and were skipped.",
  totalMismatch: "Line items don't add up to the receipt total. Check them before saving.",
  noTotal: "The receipt total couldn't be read.",
  noDate: "The receipt date couldn't be read.",
  currencyMismatch: (found: string, expected: string) =>
    `This receipt looks like it's in ${found}, but your workspace uses ${expected}. Amounts were not converted.`,
} as const;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function completeItem(item: ExtractedReceipt["items"][number]): ReceiptDraft["items"][number] | null {
  const quantity = item.quantity ?? 1;
  const totalPrice = item.total_price ?? (item.unit_price === null ? null : item.unit_price * quantity);
  if (totalPrice === null) return null;

  const unitPrice = item.unit_price ?? totalPrice / quantity;
  return {
    name: item.name,
    quantity,
    unit_price: roundMoney(unitPrice),
    total_price: roundMoney(totalPrice),
  };
}

export function toReceiptDraft(receipt: ExtractedReceipt, workspaceCurrency: string): ReceiptDraft {
  const warnings: string[] = [];

  const items = receipt.items.flatMap((item) => {
    const completed = completeItem(item);
    return completed ? [completed] : [];
  });
  if (items.length < receipt.items.length) warnings.push(RECEIPT_WARNINGS.droppedItems);
  if (items.length === 0) warnings.push(RECEIPT_WARNINGS.noItems);

  const tax = receipt.tax ?? 0;
  const discount = receipt.discount ?? 0;
  const itemsTotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const computedTotal = roundMoney(itemsTotal + tax - discount);

  if (receipt.total === null) {
    warnings.push(RECEIPT_WARNINGS.noTotal);
  } else if (items.length > 0 && Math.abs(computedTotal - receipt.total) > TOTAL_TOLERANCE) {
    warnings.push(RECEIPT_WARNINGS.totalMismatch);
  }
  if (receipt.date === null) warnings.push(RECEIPT_WARNINGS.noDate);
  if (receipt.currency !== null && receipt.currency !== workspaceCurrency) {
    warnings.push(RECEIPT_WARNINGS.currencyMismatch(receipt.currency, workspaceCurrency));
  }

  const amount = receipt.total ?? (items.length > 0 ? computedTotal : null);

  return {
    merchant: receipt.merchant,
    date: receipt.date,
    category: receipt.suggested_category,
    amount: amount !== null && amount > 0 ? roundMoney(amount) : null,
    tax_amount: receipt.tax === null ? null : roundMoney(receipt.tax),
    discount_amount: receipt.discount === null ? null : roundMoney(receipt.discount),
    items,
    warnings,
  };
}
