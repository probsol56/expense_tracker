import { z } from "zod";
import { MAX_RECEIPT_ITEMS } from "@/lib/receipts/constants";

// Extractor output is untrusted model JSON. Header fields degrade to null
// instead of failing the whole receipt, and malformed items are dropped
// individually, so one misread field never discards an otherwise good scan.

const money = z.number().finite().nonnegative();

const extractedReceiptItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().finite().positive().nullable().catch(null),
  unit_price: money.nullable().catch(null),
  total_price: money.nullable().catch(null),
});

export type ExtractedReceiptItem = z.infer<typeof extractedReceiptItemSchema>;

const extractedReceiptShape = z.object({
  merchant: z.string().trim().min(1).max(100).nullable().catch(null),
  date: z.string().date().nullable().catch(null),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).nullable().catch(null),
  subtotal: money.nullable().catch(null),
  tax: money.nullable().catch(null),
  discount: money.nullable().catch(null),
  total: money.nullable().catch(null),
  suggested_category: z.string().trim().min(1).max(100).nullable().catch(null),
  items: z.array(z.unknown()).catch([]),
});

export type ExtractedReceipt = Omit<z.infer<typeof extractedReceiptShape>, "items"> & {
  items: ExtractedReceiptItem[];
};

/** Returns null when the payload isn't a receipt-shaped object at all. */
export function parseExtractedReceipt(payload: unknown): ExtractedReceipt | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const header = extractedReceiptShape.parse(payload);
  const items = header.items.slice(0, MAX_RECEIPT_ITEMS).flatMap((item) => {
    const parsed = extractedReceiptItemSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });

  return { ...header, items };
}
