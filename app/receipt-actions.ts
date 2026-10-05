"use server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceId } from "@/lib/ledger";
import { toActionError } from "@/lib/errors";
import { isReceiptMimeType, MAX_RECEIPT_BYTES, RECEIPT_FILE_EXTENSIONS, RECEIPTS_BUCKET } from "@/lib/receipts/constants";
import { toReceiptDraft, type ReceiptDraft } from "@/lib/receipts/draft";
import { RECEIPT_READ_FAILED, ReceiptExtractionError } from "@/lib/receipts/extractor";
import { GeminiReceiptExtractor } from "@/lib/receipts/gemini";
import type { SupabaseClient } from "@supabase/supabase-js";

// Enough for the model to match against without bloating the prompt.
const MAX_PROMPT_CATEGORIES = 100;
const DEFAULT_CURRENCY = "BDT";

// `{workspace_id}/{uuid}.{ext}` — the shape the upload step writes.
const UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const receiptPathSchema = z
  .string()
  .regex(new RegExp(`^${UUID_PATTERN}/${UUID_PATTERN}\\.(${Object.values(RECEIPT_FILE_EXTENSIONS).join("|")})$`));

export type ExtractReceiptResult = { error: string } | { success: true; draft: ReceiptDraft };

const extractor = new GeminiReceiptExtractor();

async function loadExtractionContext(supabase: SupabaseClient, workspaceId: string) {
  const [{ data: workspace }, { data: categories }] = await Promise.all([
    supabase.from("workspaces").select("base_currency").eq("id", workspaceId).maybeSingle(),
    supabase
      .from("categories")
      .select("name")
      .eq("workspace_id", workspaceId)
      .eq("type", "expense")
      .order("name")
      .limit(MAX_PROMPT_CATEGORIES),
  ]);

  const currency = z.string().length(3).catch(DEFAULT_CURRENCY).parse(workspace?.base_currency);
  const names = z.array(z.object({ name: z.string() })).catch([]).parse(categories ?? []);
  return { currency, categories: names.map((category) => category.name) };
}

async function finishScan(supabase: SupabaseClient, scanId: string, status: "succeeded" | "failed", errorCode?: string) {
  const { error } = await supabase.rpc("finish_receipt_scan", {
    p_scan_id: scanId,
    p_status: status,
    p_error: errorCode ?? null,
  });
  // The scan already counted against the quota; a failed log update must not
  // cost the user their result, but it should be visible.
  if (error) {
    console.error("finish_receipt_scan failed", error.code);
    Sentry.captureException(error);
  }
}

/**
 * Reads a receipt the browser already uploaded to the private bucket and
 * returns a draft for the transaction form. Nothing is saved to the ledger.
 */
export async function extractReceipt(receiptPath: string): Promise<ExtractReceiptResult> {
  const parsedPath = receiptPathSchema.safeParse(receiptPath);
  if (!parsedPath.success) return { error: "Invalid receipt." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to scan a receipt." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before scanning receipts." };
  if (!parsedPath.data.startsWith(`${workspace.id}/`)) return { error: "Invalid receipt." };

  // Quota + workspace + path checks happen inside the RPC, atomically.
  const { data: scanId, error: scanError } = await supabase.rpc("start_receipt_scan", {
    p_workspace_id: workspace.id,
    p_receipt_path: parsedPath.data,
  });
  if (scanError) return { error: toActionError(scanError, "Couldn't start the scan. Try again.") };
  const parsedScanId = z.string().uuid().safeParse(scanId);
  if (!parsedScanId.success) return { error: "Couldn't start the scan. Try again." };

  const { data: blob, error: downloadError } = await supabase.storage.from(RECEIPTS_BUCKET).download(parsedPath.data);
  if (downloadError || !blob) {
    await finishScan(supabase, parsedScanId.data, "failed", "download_failed");
    return { error: "Couldn't find the uploaded receipt. Upload it again." };
  }
  if (blob.size > MAX_RECEIPT_BYTES || !isReceiptMimeType(blob.type)) {
    await finishScan(supabase, parsedScanId.data, "failed", "unsupported_file");
    return { error: "Use a JPG, PNG, WebP or PDF receipt under 10 MB." };
  }

  try {
    const context = await loadExtractionContext(supabase, workspace.id);
    const receipt = await extractor.extract(
      { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType: blob.type },
      context,
    );
    await finishScan(supabase, parsedScanId.data, "succeeded");
    return { success: true, draft: toReceiptDraft(receipt, context.currency) };
  } catch (error: unknown) {
    if (error instanceof ReceiptExtractionError) {
      await finishScan(supabase, parsedScanId.data, "failed", error.code);
      return { error: error.userMessage };
    }
    await finishScan(supabase, parsedScanId.data, "failed", "unexpected");
    console.error("receipt extraction failed");
    Sentry.captureException(error);
    return { error: RECEIPT_READ_FAILED };
  }
}
