import type { ReceiptMimeType } from "@/lib/receipts/constants";
import type { ExtractedReceipt } from "@/lib/receipts/schema";

export const RECEIPT_READ_FAILED = "Couldn't read this receipt. Try again or enter the details manually.";

export type ReceiptFile = {
  bytes: Uint8Array;
  mimeType: ReceiptMimeType;
};

export type ReceiptExtractionContext = {
  /** Existing category names, so the suggestion reuses one instead of inventing a near-duplicate. */
  categories: string[];
  currency: string;
};

/** Provider-agnostic seam: swapping Gemini for another engine touches only the implementation. */
export interface ReceiptExtractor {
  readonly provider: string;
  extract(file: ReceiptFile, context: ReceiptExtractionContext): Promise<ExtractedReceipt>;
}

/**
 * `userMessage` is safe to show; `code` is a short, PII-free reason stored
 * in receipt_scans.error for diagnosing failures.
 */
export class ReceiptExtractionError extends Error {
  constructor(
    readonly code: string,
    readonly userMessage: string,
  ) {
    super(code);
    this.name = "ReceiptExtractionError";
  }
}
