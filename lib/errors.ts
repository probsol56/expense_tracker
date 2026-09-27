import type { PostgrestError } from "@supabase/supabase-js";

// Deliberate `raise exception` inside an RPC — the message is written for the
// user, so it's safe to show verbatim (see the *_rpcs.sql migrations).
const RAISE_EXCEPTION = "P0001";

/**
 * Maps a Postgres/PostgREST error to a message safe to show a user, instead
 * of returning `error.message` (an internal detail: column names, constraint
 * names, raw SQL) straight from the database. Anything not covered by
 * `overrides` or the P0001 convention logs server-side and falls back to a
 * generic message.
 */
export function toActionError(
  error: PostgrestError,
  fallback: string,
  overrides?: Record<string, string>,
): string {
  if (overrides?.[error.code]) return overrides[error.code];
  if (error.code === RAISE_EXCEPTION) return error.message;

  console.error(error);
  return fallback;
}

/** Same mapping for an error thrown as a JS exception rather than returned by Supabase. */
export function toCaughtActionError(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return toActionError(error as PostgrestError, fallback);
  }
  console.error(error);
  return fallback;
}
