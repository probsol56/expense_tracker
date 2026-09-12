"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
export async function importBankCsv(formData: FormData) {
  const file = formData.get("file"); const workspaceId = String(formData.get("workspace_id") || ""); const accountId = String(formData.get("bank_account_id") || "");
  if (!(file instanceof File) || file.size > 5_000_000) return { error: "Choose a CSV file smaller than 5 MB." };
  if (!workspaceId || !accountId) return { error: "Workspace and bank account are required." };
  const parsed = parseCsv(await file.text()); if (!parsed.rows.length) return { error: parsed.errors.join(" ") };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: "Please sign in to import transactions." };
  const records = parsed.rows.map(row => ({ workspace_id: workspaceId, bank_account_id: accountId, merchant: row.merchant, amount: row.amount, transaction_date: row.date, metadata: { category: row.category ?? null } }));
  const { error } = await supabase.from("bank_transactions").upsert(records, { onConflict: "bank_account_id,external_id", ignoreDuplicates: true });
  const status = error ? "failed" : parsed.errors.length ? "partial" : "completed";
  await supabase.from("import_batches").insert({ workspace_id: workspaceId, bank_account_id: accountId, imported_by: user.id, filename: file.name, row_count: parsed.rows.length + parsed.errors.length, imported_count: error ? 0 : parsed.rows.length, failed_count: parsed.errors.length, status, error_summary: parsed.errors.join(" ") || null });
  if (error) return { error: error.message };
  revalidatePath("/"); revalidatePath("/transactions"); return { success: true, warning: parsed.errors.length ? `${parsed.errors.length} rows were skipped.` : undefined };
}
