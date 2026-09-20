"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { assertAccountInWorkspace, getUserWorkspaceId, resolveCategoryId, resolveMerchantId } from "@/lib/ledger";

const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "cash", "investment"] as const;
const TRANSFER_CATEGORY = "Transfer";
const TRANSFER_MERCHANT = "Transfer";

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function getAccountNames(
  supabase: SupabaseClient,
  workspaceId: string,
  accountIds: string[],
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("accounts")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .in("id", accountIds);
  return new Map((data ?? []).map((account) => [account.id as string, account.name as string]));
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

  const [fromValid, toValid] = await Promise.all([
    assertAccountInWorkspace(supabase, workspace.id, fromAccountId),
    assertAccountInWorkspace(supabase, workspace.id, toAccountId),
  ]);
  if (!fromValid || !toValid) return { error: "Select valid accounts." };

  const accountNames = await getAccountNames(supabase, workspace.id, [fromAccountId, toAccountId]);
  const fromName = accountNames.get(fromAccountId) ?? "the source account";
  const toName = accountNames.get(toAccountId) ?? "the destination account";

  try {
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount,
        date,
        notes: notes || null,
      })
      .select("id")
      .single();
    if (transferError) return { error: transferError.message };

    const [categoryId, merchantId] = await Promise.all([
      resolveCategoryId(supabase, workspace.id, "transfer", TRANSFER_CATEGORY),
      resolveMerchantId(supabase, workspace.id, TRANSFER_MERCHANT),
    ]);

    const { data: fromTransaction, error: fromError } = await supabase
      .from("transactions")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        account_id: fromAccountId,
        category_id: categoryId,
        merchant_id: merchantId,
        notes: notes || `Transfer to ${toName}`,
        amount: -amount,
        date,
        status: "cleared",
      })
      .select("id")
      .single();
    if (fromError) return { error: fromError.message };

    const { data: toTransaction, error: toError } = await supabase
      .from("transactions")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        account_id: toAccountId,
        category_id: categoryId,
        merchant_id: merchantId,
        notes: notes || `Transfer from ${fromName}`,
        amount,
        date,
        status: "cleared",
      })
      .select("id")
      .single();
    if (toError) return { error: toError.message };

    const { error: linkError } = await supabase
      .from("transfers")
      .update({ from_transaction_id: fromTransaction.id, to_transaction_id: toTransaction.id })
      .eq("id", transfer.id);
    if (linkError) return { error: linkError.message };
  } catch (err) {
    return { error: getActionErrorMessage(err, "Failed to record the transfer.") };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}

export async function updateTransfer(transferId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a transfer." };

  const { data: transfer, error: transferError } = await supabase
    .from("transfers")
    .select("id, user_id, workspace_id, from_transaction_id, to_transaction_id")
    .eq("id", transferId)
    .maybeSingle();
  if (transferError) return { error: transferError.message };
  if (!transfer) return { error: "Transfer not found." };
  if (transfer.user_id !== user.id) return { error: "You don't have permission to update this transfer." };
  if (!transfer.from_transaction_id || !transfer.to_transaction_id) {
    return { error: "This transfer is missing its ledger entries and can't be edited here." };
  }

  const fromAccountId = String(formData.get("from_account_id") ?? "").trim();
  const toAccountId = String(formData.get("to_account_id") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fromAccountId || !toAccountId) return { error: "Select both accounts for the transfer." };
  if (fromAccountId === toAccountId) return { error: "Choose two different accounts." };
  if (!date) return { error: "Date is required." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Transfer amount must be greater than zero." };

  const [fromValid, toValid] = await Promise.all([
    assertAccountInWorkspace(supabase, transfer.workspace_id, fromAccountId),
    assertAccountInWorkspace(supabase, transfer.workspace_id, toAccountId),
  ]);
  if (!fromValid || !toValid) return { error: "Select valid accounts." };

  const accountNames = await getAccountNames(supabase, transfer.workspace_id, [fromAccountId, toAccountId]);
  const fromName = accountNames.get(fromAccountId) ?? "the source account";
  const toName = accountNames.get(toAccountId) ?? "the destination account";

  try {
    const { error: fromError } = await supabase
      .from("transactions")
      .update({
        account_id: fromAccountId,
        amount: -amount,
        date,
        notes: notes || `Transfer to ${toName}`,
      })
      .eq("id", transfer.from_transaction_id);
    if (fromError) return { error: fromError.message };

    const { error: toError } = await supabase
      .from("transactions")
      .update({
        account_id: toAccountId,
        amount,
        date,
        notes: notes || `Transfer from ${fromName}`,
      })
      .eq("id", transfer.to_transaction_id);
    if (toError) return { error: toError.message };
  } catch (err) {
    return { error: getActionErrorMessage(err, "Failed to update the linked transactions.") };
  }

  const { error: updateError } = await supabase
    .from("transfers")
    .update({
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount,
      date,
      notes: notes || null,
    })
    .eq("id", transferId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}

export async function deleteTransfer(transferId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to delete a transfer." };

  const { data: transfer, error: transferError } = await supabase
    .from("transfers")
    .select("id, user_id, from_transaction_id, to_transaction_id")
    .eq("id", transferId)
    .maybeSingle();
  if (transferError) return { error: transferError.message };
  if (!transfer) return { error: "Transfer not found." };
  if (transfer.user_id !== user.id) return { error: "You don't have permission to delete this transfer." };

  const transactionIds = [transfer.from_transaction_id, transfer.to_transaction_id].filter(
    (id): id is string => Boolean(id),
  );
  if (transactionIds.length) {
    const { error: deleteTransactionsError } = await supabase
      .from("transactions")
      .delete()
      .in("id", transactionIds);
    if (deleteTransactionsError) return { error: deleteTransactionsError.message };
  }

  const { error: deleteError } = await supabase.from("transfers").delete().eq("id", transferId);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}
