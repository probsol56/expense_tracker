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
