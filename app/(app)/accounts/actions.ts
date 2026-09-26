"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceId } from "@/lib/ledger";

const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "cash", "investment"] as const;
const RAISE_EXCEPTION = "P0001";

function toTransferError(error: PostgrestError, fallback: string) {
  // P0001 = messages raised by the transfer functions themselves, written for users.
  return error.code === RAISE_EXCEPTION ? error.message : fallback;
}

function revalidateTransferPaths() {
  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add an account." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before adding accounts." };

  const name = String(formData.get("name") ?? "").trim();
  const accountTypeRaw = String(formData.get("account_type") ?? "checking").trim();
  const institution = String(formData.get("institution") ?? "").trim();
  const startingBalance = Number(formData.get("starting_balance") ?? 0);

  if (!name) return { error: "Account name is required." };
  const accountType = ACCOUNT_TYPES.includes(accountTypeRaw as (typeof ACCOUNT_TYPES)[number])
    ? accountTypeRaw
    : "checking";
  if (!Number.isFinite(startingBalance)) return { error: "Starting balance must be a number." };

  const { error } = await supabase.from("accounts").insert({
    workspace_id: workspace.id,
    name,
    account_type: accountType,
    institution: institution || null,
    balance: startingBalance,
    starting_balance: startingBalance,
    last_synced_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true };
}

export async function createTransfer(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to record a transfer." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before recording transfers." };

  const fromAccountId = String(formData.get("from_account_id") ?? "").trim();
  const toAccountId = String(formData.get("to_account_id") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fromAccountId || !toAccountId) return { error: "Select both accounts for the transfer." };
  if (fromAccountId === toAccountId) return { error: "Choose two different accounts." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Transfer amount must be greater than zero." };

  const { error } = await supabase.rpc("create_transfer", {
    p_workspace_id: workspace.id,
    p_from_account_id: fromAccountId,
    p_to_account_id: toAccountId,
    p_amount: amount,
    p_date: date,
    p_notes: notes,
  });
  if (error) return { error: toTransferError(error, "Failed to record the transfer.") };

  revalidateTransferPaths();
  return { success: true };
}

export async function updateTransfer(transferId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a transfer." };

  const fromAccountId = String(formData.get("from_account_id") ?? "").trim();
  const toAccountId = String(formData.get("to_account_id") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fromAccountId || !toAccountId) return { error: "Select both accounts for the transfer." };
  if (fromAccountId === toAccountId) return { error: "Choose two different accounts." };
  if (!date) return { error: "Date is required." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Transfer amount must be greater than zero." };

  const { error } = await supabase.rpc("update_transfer", {
    p_transfer_id: transferId,
    p_from_account_id: fromAccountId,
    p_to_account_id: toAccountId,
    p_amount: amount,
    p_date: date,
    p_notes: notes,
  });
  if (error) return { error: toTransferError(error, "Failed to update the transfer.") };

  revalidateTransferPaths();
  return { success: true };
}

export async function deleteTransfer(transferId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to delete a transfer." };

  const { error } = await supabase.rpc("delete_transfer", { p_transfer_id: transferId });
  if (error) return { error: toTransferError(error, "Failed to delete the transfer.") };

  revalidateTransferPaths();
  return { success: true };
}
