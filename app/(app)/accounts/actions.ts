"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceId } from "@/lib/ledger";
import { accountSchema, deleteLedgerAccountSchema, transferSchema } from "@/lib/validations";
import { toActionError } from "@/lib/errors";

function revalidateTransferPaths() {
  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function createAccount(formData: FormData) {
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the account details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add an account." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before adding accounts." };

  const { name, account_type, institution, starting_balance } = parsed.data;
  const { error } = await supabase.from("accounts").insert({
    workspace_id: workspace.id,
    name,
    account_type,
    institution: institution || null,
    balance: starting_balance,
    starting_balance,
    last_synced_at: new Date().toISOString(),
  });

  if (error) return { error: toActionError(error, "Failed to add the account.") };

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true };
}

export async function deleteLedgerAccount(formData: FormData): Promise<{ error: string } | { success: true }> {
  const parsed = deleteLedgerAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Select a valid account." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to delete an account." };

  const { error } = await supabase.rpc("delete_ledger_account", { p_account_id: parsed.data.account_id });
  if (error) return { error: toActionError(error, "Failed to delete the account.") };

  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/loans");
  revalidatePath("/recurring");
  revalidatePath("/reports");
  revalidatePath("/transactions");
  return { success: true };
}

export async function createTransfer(formData: FormData) {
  const parsed = transferSchema.safeParse({
    ...Object.fromEntries(formData),
    date: formData.get("date") || new Date().toISOString().slice(0, 10),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the transfer details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to record a transfer." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before recording transfers." };

  const { from_account_id, from_account_name, to_account_id, to_account_name, amount, date, notes } = parsed.data;
  const { error } = await supabase.rpc("create_transfer", {
    p_workspace_id: workspace.id,
    p_from_account_id: from_account_id || null,
    p_from_account_name: from_account_name || "",
    p_to_account_id: to_account_id || null,
    p_to_account_name: to_account_name || "",
    p_amount: amount,
    p_date: date,
    p_notes: notes ?? "",
  });
  if (error) return { error: toActionError(error, "Failed to record the transfer.") };

  revalidateTransferPaths();
  return { success: true };
}

export async function updateTransfer(transferId: string, formData: FormData) {
  const parsed = transferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the transfer details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a transfer." };

  const { from_account_id, from_account_name, to_account_id, to_account_name, amount, date, notes } = parsed.data;
  const { error } = await supabase.rpc("update_transfer", {
    p_transfer_id: transferId,
    p_from_account_id: from_account_id || null,
    p_from_account_name: from_account_name || "",
    p_to_account_id: to_account_id || null,
    p_to_account_name: to_account_name || "",
    p_amount: amount,
    p_date: date,
    p_notes: notes ?? "",
  });
  if (error) return { error: toActionError(error, "Failed to update the transfer.") };

  revalidateTransferPaths();
  return { success: true };
}

export async function deleteTransfer(transferId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to delete a transfer." };

  const { error } = await supabase.rpc("delete_transfer", { p_transfer_id: transferId });
  if (error) return { error: toActionError(error, "Failed to delete the transfer.") };

  revalidateTransferPaths();
  return { success: true };
}
