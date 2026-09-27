"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { transactionSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { getUserWorkspaceId, isLoanLedgerTransaction, isTransferLedgerTransaction } from "@/lib/ledger";

const RAISE_EXCEPTION = "P0001";

const transactionTypeSchema = z.enum(["expense", "income", "loan"]);

type ParsedItemRow = {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

function parseItemRows(rawData: Record<string, unknown>): ParsedItemRow[] {
  if (typeof rawData.items_json !== "string" || !rawData.items_json.trim()) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawData.items_json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const quantity = Number(value.quantity ?? 1);
    const unitPrice = Number(value.unit_price ?? value.price ?? 0);
    const totalPrice = Number(value.total_price ?? quantity * unitPrice);
    const name = String(value.name ?? "").trim();

    if (!name) return [];
    return [{
      name,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
      total_price: Number.isFinite(totalPrice) ? totalPrice : 0,
    }];
  });
}

function normalizeFormData(formData: FormData) {
  const rawData = Object.fromEntries(formData);
  // React's server-action form encoding can prefix field names when the
  // action is nested. Keep the normal names used by the validation layer.
  for (const [key, value] of Object.entries(rawData)) {
    const unprefixedKey = key.match(/^_\d+_(.+)$/)?.[1];
    if (unprefixedKey && rawData[unprefixedKey] === undefined) {
      rawData[unprefixedKey] = value;
    }
  }
  const type = transactionTypeSchema.parse(rawData.type ?? "expense");
  const rawAmount = Number(rawData.amount);
  const items = parseItemRows(rawData);
  const computedAmount = items.length
    ? items.reduce((total, item) => total + item.total_price, 0)
    : rawAmount;
  const normalized = { ...rawData, amount: Number.isFinite(computedAmount) ? Math.abs(computedAmount) : rawData.amount };
  return { type, items, parsed: transactionSchema.safeParse(normalized) };
}

function toTransactionError(error: PostgrestError, fallback: string) {
  return error.code === RAISE_EXCEPTION ? error.message : fallback;
}

function revalidateTransactionPaths() {
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function createTransaction(formData: FormData) {
  const { type, items, parsed } = normalizeFormData(formData);
  if (!parsed.success) return { error: "Check the transaction details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add a transaction." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before adding transactions." };

  const { description, merchant, category, loan_id, account_id, amount, date } = parsed.data;
  const { error } = await supabase.rpc("create_transaction_with_items", {
    p_workspace_id: workspace.id,
    p_type: type,
    p_account_id: account_id,
    p_loan_id: loan_id || null,
    p_category: category,
    p_merchant: merchant,
    p_amount: amount,
    p_date: date,
    p_notes: description ?? "",
    p_items: items,
  });
  if (error) return { error: toTransactionError(error, "Failed to save transaction.") };

  revalidateTransactionPaths();
  return { success: true };
}

export async function updateTransaction(transactionId: string, formData: FormData) {
  const { type, items, parsed } = normalizeFormData(formData);
  if (!parsed.success) return { error: "Check the transaction details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a transaction." };

  if (await isLoanLedgerTransaction(supabase, transactionId)) {
    return { error: "Manage loan disbursements and repayments from the Loans page." };
  }
  if (await isTransferLedgerTransaction(supabase, transactionId)) {
    return { error: "Manage transfers from the Accounts page." };
  }

  const { description, merchant, category, loan_id, account_id, amount, date } = parsed.data;
  const { error } = await supabase.rpc("update_transaction_with_items", {
    p_transaction_id: transactionId,
    p_type: type,
    p_account_id: account_id,
    p_loan_id: loan_id || null,
    p_category: category,
    p_merchant: merchant,
    p_amount: amount,
    p_date: date,
    p_notes: description ?? "",
    p_items: items,
  });
  if (error) return { error: toTransactionError(error, "Failed to update transaction.") };

  revalidateTransactionPaths();
  return { success: true };
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to delete a transaction." };

  const { data: transaction } = await supabase.from("transactions").select("user_id").eq("id", transactionId).maybeSingle();
  if (!transaction) return { error: "Transaction not found." };
  if (transaction.user_id !== user.id) return { error: "You don't have permission to delete this transaction." };
  if (await isLoanLedgerTransaction(supabase, transactionId)) {
    return { error: "Loan disbursements and repayments can't be deleted from here." };
  }
  if (await isTransferLedgerTransaction(supabase, transactionId)) {
    return { error: "Transfers can't be deleted from here — manage them from the Accounts page." };
  }

  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
  if (error) return { error: error.message };
  revalidateTransactionPaths();
  return { success: true };
}
