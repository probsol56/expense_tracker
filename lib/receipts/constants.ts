export const RECEIPTS_BUCKET = "receipts";

// Mirrors storage.buckets in 20261005000000_receipt_scanning.sql — change both together.
export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type ReceiptMimeType = (typeof RECEIPT_MIME_TYPES)[number];

export const RECEIPT_FILE_EXTENSIONS: Record<ReceiptMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const MAX_RECEIPT_ITEMS = 200;

export function isReceiptMimeType(value: string): value is ReceiptMimeType {
  return (RECEIPT_MIME_TYPES as readonly string[]).includes(value);
}
