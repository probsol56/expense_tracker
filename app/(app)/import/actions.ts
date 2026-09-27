"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
import { importSchema } from "@/lib/validations";
import { assertBankAccountInWorkspace, getUserWorkspaceId } from "@/lib/ledger";
import { toActionError } from "@/lib/errors";

const MAX_FILE_SIZE = 5_000_000;

export async function importBankCsv(formData: FormData) {
  const parsed = importSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Select a bank account." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file." };
  if (file.size > MAX_FILE_SIZE) return { error: "Choose a CSV file smaller than 5 MB." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to import transactions." };

  // The workspace is derived from the signed-in user, never trusted from the
  // form, and the bank account is checked against it before anything writes.
  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before importing transactions." };

  const { bank_account_id } = parsed.data;
  if (!(await assertBankAccountInWorkspace(supabase, workspace.id, bank_account_id))) {
    return { error: "Select a valid bank account." };
  }

  const csv = parseCsv(await file.text());
  if (!csv.rows.length) return { error: csv.errors.join(" ") || "The file has no importable rows." };

  const records = csv.rows.map((row) => ({
    workspace_id: workspace.id,
    bank_account_id,
    merchant: row.merchant,
    amount: row.amount,
    transaction_date: row.date,
    metadata: { category: row.category ?? null },
  }));

  const { error: insertError } = await supabase
    .from("bank_transactions")
    .upsert(records, { onConflict: "bank_account_id,external_id", ignoreDuplicates: true });

  const status = insertError ? "failed" : csv.errors.length ? "partial" : "completed";
  const { error: batchError } = await supabase.from("import_batches").insert({
    workspace_id: workspace.id,
    bank_account_id,
    imported_by: user.id,
    filename: file.name,
    row_count: csv.rows.length + csv.errors.length,
    imported_count: insertError ? 0 : csv.rows.length,
    failed_count: csv.errors.length,
    status,
    error_summary: csv.errors.join(" ") || null,
  });
  if (insertError) return { error: toActionError(insertError, "Failed to import the file.") };
  if (batchError) console.error(batchError);

  revalidatePath("/");
  revalidatePath("/transactions");

  const warnings = [
    csv.errors.length ? `${csv.errors.length} rows were skipped.` : null,
    batchError ? "The import log couldn't be recorded." : null,
  ].filter(Boolean);

  return { success: true, warning: warnings.length ? warnings.join(" ") : undefined };
}
