import { z } from "zod";

// Server-only secrets, kept out of lib/config.ts because that module is also
// bundled for the browser. Read lazily so `next build` (which has no secrets)
// doesn't crash; a missing key fails loudly at the first call that needs it.

const geminiApiKeySchema = z.string().min(1);

export function getGeminiApiKey(): string {
  if (typeof window !== "undefined") {
    throw new Error("getGeminiApiKey() must only run on the server.");
  }
  const parsed = geminiApiKeySchema.safeParse(process.env.GEMINI_API_KEY);
  if (!parsed.success) {
    throw new Error("Invalid environment configuration:\n- GEMINI_API_KEY: required for receipt scanning");
  }
  return parsed.data;
}

const folioApiKeySchema = z.string().min(1);

/** Aqlyn Folio API key — full admin rights on the report server, so it must never reach the browser. */
export function getFolioApiKey(): string {
  if (typeof window !== "undefined") {
    throw new Error("getFolioApiKey() must only run on the server.");
  }
  const parsed = folioApiKeySchema.safeParse(process.env.FOLIO_API_KEY);
  if (!parsed.success) {
    throw new Error("Invalid environment configuration:\n- FOLIO_API_KEY: required for reports");
  }
  return parsed.data;
}

/** True when the Folio API key is present — lets pages hide reports instead of failing on use. */
export function hasFolioApiKey(): boolean {
  return folioApiKeySchema.safeParse(process.env.FOLIO_API_KEY).success;
}
