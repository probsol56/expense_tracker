// Deletes receipt files no transaction references (see
// 20261005020000_receipt_cleanup.sql). Invoked daily by pg_cron; it needs the
// service-role key because storage RLS only lets members delete their own
// workspace's files, and orphans may belong to deleted workspaces.
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const RECEIPTS_BUCKET = "receipts";
const BATCH_SIZE = 100;
// Bounds a single run; whatever is left is picked up the next day.
const MAX_BATCHES = 20;

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function constantTimeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function parseNames(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.filter((name): name is string => typeof name === "string");
}

Deno.serve(async (request) => {
  const secret = requireEnv("RECEIPT_CLEANUP_SECRET");
  if (request.method !== "POST" || !constantTimeEqual(request.headers.get("x-cleanup-secret") ?? "", secret)) {
    return json(401, { error: "unauthorized" });
  }

  const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let removed = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const { data, error } = await supabase.rpc("list_orphaned_receipts", { p_limit: BATCH_SIZE });
    if (error) {
      console.error("list_orphaned_receipts failed", error.message);
      return json(500, { error: "list_failed", removed });
    }

    const names = parseNames(data);
    if (names.length === 0) break;

    const { error: removeError } = await supabase.storage.from(RECEIPTS_BUCKET).remove(names);
    if (removeError) {
      console.error("receipt removal failed", removeError.message);
      return json(500, { error: "remove_failed", removed });
    }

    removed += names.length;
    if (names.length < BATCH_SIZE) break;
  }

  console.log(`removed ${removed} orphaned receipts`);
  return json(200, { removed });
});
