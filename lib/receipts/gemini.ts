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

// Free-tier model. Check https://ai.google.dev/gemini-api/docs/models when bumping.
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 45_000;
const HTTP_TOO_MANY_REQUESTS = 429;

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
    "- items: only purchased products or services. Do not list VAT, tax, service charge, discount, subtotal, total, cash tendered or change as items.",
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

async function postToGemini(file: ReceiptFile, context: ReceiptExtractionContext): Promise<Response> {
  // Outside the try: a missing key is a config bug, not a network failure.
  const apiKey = getGeminiApiKey();
  try {
    return await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: file.mimeType, data: toBase64(file.bytes) } },
              { text: buildPrompt(context) },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
    const response = await postToGemini(file, context);

    if (response.status === HTTP_TOO_MANY_REQUESTS) {
      throw new ReceiptExtractionError("gemini_429", "Receipt scanning is busy right now. Try again in a minute.");
    }
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
}
