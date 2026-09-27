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
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${parsed.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`).join("\n")}`);
  }

  const env = parsed.data;
  return Object.freeze({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    siteUrl: env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  });
}

export const config = loadConfig();
