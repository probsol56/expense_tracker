import { z } from "zod";
import { getGeminiApiKey } from "@/lib/server-config";
import { parseExtractedReceipt, type ExtractedReceipt } from "@/lib/receipts/schema";
import {
  RECEIPT_READ_FAILED,
  ReceiptExtractionError,
  type ReceiptExtractionContext,
  type ReceiptExtractor,
  type ReceiptFile,
} from "@/lib/receipts/extractor";

// Free-tier models, tried in order. The free tier often answers 503 "high
// demand" or a per-model 429 for the primary, so a lighter model backs it up.
// Check https://ai.google.dev/gemini-api/docs/models when bumping.
const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite"] as const;
// Shared by every attempt so a fallback can't push the action past it.
const REQUEST_TIMEOUT_MS = 45_000;
const BUSY_STATUSES: ReadonlySet<number> = new Set([429, 503]);
const BUSY_MESSAGE = "Receipt scanning is busy right now. Try again in a minute.";

function endpointFor(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

const nullableNumber = { type: "NUMBER", nullable: true } as const;
const nullableString = { type: "STRING", nullable: true } as const;

// Gemini's OpenAPI-subset schema. Mirrors lib/receipts/schema.ts, which re-validates the result.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    merchant: nullableString,
    date: { ...nullableString, description: "Purchase date as YYYY-MM-DD" },
    currency: { ...nullableString, description: "ISO 4217 code, e.g. BDT" },
    subtotal: nullableNumber,
    tax: { ...nullableNumber, description: "VAT, tax and service charge combined" },
    discount: { ...nullableNumber, description: "Total discount as a positive number" },
    total: { ...nullableNumber, description: "Grand total actually paid" },
    suggested_category: nullableString,
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          quantity: nullableNumber,
          unit_price: nullableNumber,
          total_price: nullableNumber,
        },
        required: ["name", "quantity", "unit_price", "total_price"],
      },
    },
  },
  required: ["merchant", "date", "currency", "subtotal", "tax", "discount", "total", "suggested_category", "items"],
} as const;

function buildPrompt(context: ReceiptExtractionContext): string {
  const categories = context.categories.length ? context.categories.join(", ") : "(none yet)";
  return [
    "Extract the purchase from this receipt or invoice. Receipts may mix Bangla and English.",
    "- Write every amount as a plain JSON number using Western digits (convert Bangla digits like ১২৫ to 125). Never include currency symbols such as ৳ or Tk.",
    "- items: only purchased products or services. Do not list VAT, tax, service charge, discount, subtotal, total, cash tendered, paid, due or change as items.",
    "- Delivery, shipping and packaging charges are items: add each as its own item named as printed (e.g. Shipping Cost).",
    "- Put VAT + tax + service charge into `tax` and all discounts into `discount` (positive number).",
    "- total is the final amount paid. Keep item names as printed; transliterate Bangla names only if unreadable otherwise.",
    `- If no currency is printed, assume ${context.currency}.`,
    `- suggested_category: pick the best match from these existing categories: ${categories}. Only propose a new short name if none fit.`,
    "- Use null for anything you cannot read. Do not guess.",
  ].join("\n");
}

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        finishReason: z.string().optional(),
        content: z.object({ parts: z.array(z.object({ text: z.string().optional() })) }).optional(),
      }),
    )
    .optional(),
});

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
}

function buildRequestBody(file: ReceiptFile, context: ReceiptExtractionContext): string {
  return JSON.stringify({
    contents: [
      {
        parts: [
          { inline_data: { mime_type: file.mimeType, data: toBase64(file.bytes) } },
          { text: buildPrompt(context) },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });
}

async function postToGemini(model: string, apiKey: string, body: string, signal: AbortSignal): Promise<Response> {
  try {
    return await fetch(endpointFor(model), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body,
      signal,
      cache: "no-store",
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ReceiptExtractionError("gemini_timeout", "Reading the receipt took too long. Try again.");
    }
    throw new ReceiptExtractionError("gemini_network", RECEIPT_READ_FAILED);
  }
}

function extractJsonText(body: unknown): string {
  const parsed = geminiResponseSchema.safeParse(body);
  const candidate = parsed.success ? parsed.data.candidates?.[0] : undefined;
  const text = candidate?.content?.parts.map((part) => part.text ?? "").join("") ?? "";
  if (!text) {
    throw new ReceiptExtractionError(`gemini_empty_${candidate?.finishReason ?? "unknown"}`.toLowerCase(), RECEIPT_READ_FAILED);
  }
  return text;
}

export class GeminiReceiptExtractor implements ReceiptExtractor {
  readonly provider = "gemini";

  async extract(file: ReceiptFile, context: ReceiptExtractionContext): Promise<ExtractedReceipt> {
    const response = await this.requestFirstAvailable(file, context);
    if (!response.ok) {
      throw new ReceiptExtractionError(`gemini_http_${response.status}`, RECEIPT_READ_FAILED);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(extractJsonText(await response.json()));
    } catch (error: unknown) {
      if (error instanceof ReceiptExtractionError) throw error;
      throw new ReceiptExtractionError("gemini_invalid_json", RECEIPT_READ_FAILED);
    }

    const receipt = parseExtractedReceipt(payload);
    if (!receipt) throw new ReceiptExtractionError("gemini_invalid_shape", RECEIPT_READ_FAILED);
    return receipt;
  }

  /** The first response that isn't a busy signal; throws if every model is busy. */
  private async requestFirstAvailable(file: ReceiptFile, context: ReceiptExtractionContext): Promise<Response> {
    // Outside postToGemini's try: a missing key is a config bug, not a network failure.
    const apiKey = getGeminiApiKey();
    const body = buildRequestBody(file, context);
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

    let busyStatus = 0;
    for (const model of GEMINI_MODELS) {
      const response = await postToGemini(model, apiKey, body, signal);
      if (!BUSY_STATUSES.has(response.status)) return response;
      busyStatus = response.status;
    }
    throw new ReceiptExtractionError(`gemini_${busyStatus}`, BUSY_MESSAGE);
  }
}
