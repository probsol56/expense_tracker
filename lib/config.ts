import { z } from "zod";

// Parsed once, at import time, so a missing or malformed env var crashes the
// process at boot instead of surfacing later as a null Supabase client or a
// `!`-asserted undefined deep in a request handler.
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

function loadConfig() {
  // Each key must be referenced literally: Next.js inlines `process.env.NEXT_PUBLIC_*`
  // into the browser bundle only by exact match, and `process.env` itself is empty there.
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${parsed.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`).join("\n")}`);
  }

  const env = parsed.data;
  return Object.freeze({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    siteUrl: env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    isProduction: process.env.NODE_ENV === "production",
  });
}

export const config = loadConfig();
