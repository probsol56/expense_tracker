"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { transactionSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";
import { assertAccountInWorkspace, assertLoanInWorkspace, getUserWorkspaceId, isLoanLedgerTransaction, resolveCategoryId, resolveMerchantId } from "@/lib/ledger";

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

function getSignedAmount(type: string, amount: number) {
  return type === "income" ? Math.abs(amount) : -Math.abs(amount);
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

async function insertTransactionItems(supabase: any, transactionId: string, items: ParsedItemRow[]) {
  if (!items.length) return;

  const { error } = await supabase.from("transaction_items").insert(
    items.map((item) => ({
      transaction_id: transactionId,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))
  );
  if (error) throw error;
}

async function replaceTransactionItems(supabase: any, transactionId: string, items: ParsedItemRow[]) {
  const { error: deleteError } = await supabase
    .from("transaction_items")
    .delete()
    .eq("transaction_id", transactionId);
  if (deleteError) throw deleteError;
  await insertTransactionItems(supabase, transactionId, items);
}

export async function createTransaction(formData: FormData) {
  const { type, items, parsed } = normalizeFormData(formData);
  if (!parsed.success) return { error: "Check the transaction details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add a transaction." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before adding transactions." };

  try {
    const { description, merchant, category, loan_id, ...transactionData } = parsed.data;
    if (!(await assertAccountInWorkspace(supabase, workspace.id, transactionData.account_id))) {
      return { error: "Select a valid account." };
    }
    if (loan_id && !(await assertLoanInWorkspace(supabase, workspace.id, loan_id))) {
      return { error: "Select a valid loan." };
    }
    const [categoryId, merchantId] = await Promise.all([
      resolveCategoryId(supabase, workspace.id, type, category),
      resolveMerchantId(supabase, workspace.id, merchant),
    ]);

    const { data: inserted, error } = await supabase.from("transactions").insert({
      ...transactionData,
      category_id: categoryId,
      merchant_id: merchantId,
      loan_id: loan_id || null,
      notes: description?.trim() || null,
      workspace_id: workspace.id,
      user_id: user.id,
      amount: getSignedAmount(type, transactionData.amount),
    }).select("id").single();

    if (error) return { error: error.message };
    await insertTransactionItems(supabase, inserted.id, items);
    revalidatePath("/"); revalidatePath("/transactions");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to save transaction.") };
  }
}

export async function updateTransaction(transactionId: string, formData: FormData) {
  const { type, items, parsed } = normalizeFormData(formData);
  if (!parsed.success) return { error: "Check the transaction details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a transaction." };

  const { data: transaction } = await supabase.from("transactions").select("user_id, workspace_id").eq("id", transactionId).maybeSingle();
  if (!transaction) return { error: "Transaction not found." };
  if (transaction.user_id !== user.id) return { error: "You don't have permission to update this transaction." };
  if (await isLoanLedgerTransaction(supabase, transactionId)) {
    return { error: "Manage loan disbursements and repayments from the Loans page." };
  }

  try {
    const { description, merchant, category, loan_id, ...transactionData } = parsed.data;
    if (!(await assertAccountInWorkspace(supabase, transaction.workspace_id, transactionData.account_id))) {
      return { error: "Select a valid account." };
    }
    if (loan_id && !(await assertLoanInWorkspace(supabase, transaction.workspace_id, loan_id))) {
      return { error: "Select a valid loan." };
    }
    const [categoryId, merchantId] = await Promise.all([
      resolveCategoryId(supabase, transaction.workspace_id, type, category),
      resolveMerchantId(supabase, transaction.workspace_id, merchant),
    ]);

    const { error } = await supabase.from("transactions").update({
      ...transactionData,
      category_id: categoryId,
      merchant_id: merchantId,
      loan_id: loan_id || null,
      notes: description?.trim() || null,
      amount: getSignedAmount(type, transactionData.amount),
    }).eq("id", transactionId);
    if (error) return { error: error.message };
    await replaceTransactionItems(supabase, transactionId, items);
    revalidatePath("/"); revalidatePath("/transactions");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update transaction.") };
  }
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

  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
  if (error) return { error: error.message };
  revalidatePath("/"); revalidatePath("/transactions");
  return { success: true };
}
