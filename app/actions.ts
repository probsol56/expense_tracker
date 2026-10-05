"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { transactionReceiptFieldsSchema, transactionSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceId, isLoanLedgerTransaction, isTransferLedgerTransaction } from "@/lib/ledger";
import { toActionError } from "@/lib/errors";
import { PICKER_LIMITS } from "@/lib/pagination";
import type { CategoryType } from "@/lib/category-options";
import type { TransactionItem } from "@/lib/types";

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
  const receiptFields = transactionReceiptFieldsSchema.safeParse(rawData);
  if (!receiptFields.success) return { type, items, receipt: null, parsed: transactionSchema.safeParse({}) };

  // Tax/discount only adjust an itemised total. Without items the user types
  // the amount paid directly, so a breakdown would be unverifiable — drop it.
  const receipt = items.length
    ? receiptFields.data
    : { ...receiptFields.data, tax_amount: null, discount_amount: null };
  // A discount larger than the items leaves this negative, so validation rejects it rather than flipping the sign.
  const computedAmount = items.length
    ? Math.round((items.reduce((total, item) => total + item.total_price, 0) + (receipt.tax_amount ?? 0) - (receipt.discount_amount ?? 0)) * 100) / 100
    : Math.abs(rawAmount);
  const normalized = { ...rawData, amount: Number.isFinite(computedAmount) ? computedAmount : rawData.amount };
  return { type, items, receipt, parsed: transactionSchema.safeParse(normalized) };
}

function revalidateTransactionPaths() {
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function createTransaction(formData: FormData) {
  const { type, items, receipt, parsed } = normalizeFormData(formData);
  if (!parsed.success || !receipt) return { error: "Check the transaction details and try again." };

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
    p_tax_amount: receipt.tax_amount,
    p_discount_amount: receipt.discount_amount,
    p_receipt_path: receipt.receipt_path,
  });
  if (error) return { error: toActionError(error, "Failed to save transaction.") };

  revalidateTransactionPaths();
  return { success: true };
}

export async function updateTransaction(transactionId: string, formData: FormData) {
  const { type, items, receipt, parsed } = normalizeFormData(formData);
  if (!parsed.success || !receipt) return { error: "Check the transaction details and try again." };

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
    p_tax_amount: receipt.tax_amount,
    p_discount_amount: receipt.discount_amount,
    p_receipt_path: receipt.receipt_path,
  });
  if (error) return { error: toActionError(error, "Failed to update transaction.") };

  revalidateTransactionPaths();
  return { success: true };
}

export type TransactionEditDetails = {
  items: TransactionItem[];
  tax_amount: number | null;
  discount_amount: number | null;
  receipt_path: string | null;
};

const receiptColumnsSchema = z.object({
  tax_amount: z.coerce.number().nullable(),
  discount_amount: z.coerce.number().nullable(),
  receipt_path: z.string().nullable(),
});

/**
 * Line items and receipt fields for a transaction being edited — RLS scopes
 * this to the caller's workspace. Throws on failure: saving after a silent
 * empty load would wipe the real items and receipt.
 */
export async function getTransactionForEdit(transactionId: string): Promise<TransactionEditDetails> {
  const supabase = await createClient();
  const [{ data, error }, { data: receiptRow, error: receiptError }] = await Promise.all([
    supabase
      .from("transaction_items")
      .select("id, name, quantity, unit_price, total_price")
      .eq("transaction_id", transactionId),
    supabase
      .from("transactions")
      .select("tax_amount, discount_amount, receipt_path")
      .eq("id", transactionId)
      .maybeSingle(),
  ]);
  if (error || receiptError) {
    console.error(error ?? receiptError);
    throw new Error("Couldn't load the transaction for editing.");
  }

  const receipt = receiptColumnsSchema.safeParse(receiptRow);
  return {
    tax_amount: receipt.success ? receipt.data.tax_amount : null,
    discount_amount: receipt.success ? receipt.data.discount_amount : null,
    receipt_path: receipt.success ? receipt.data.receipt_path : null,
    items: (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0,
    })),
  };
}

/** Category/merchant names already used in the caller's workspace, for the transaction form's suggestions. */
export async function getWorkspaceSuggestions(): Promise<{
  categories: Record<CategoryType, string[]>;
  merchants: string[];
}> {
  const empty = { categories: { expense: [], income: [], loan: [] } as Record<CategoryType, string[]>, merchants: [] };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return empty;

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return empty;

  const [{ data: categoryRows }, { data: merchantRows }] = await Promise.all([
    supabase.from("categories").select("name, type").eq("workspace_id", workspace.id).order("name", { ascending: true }).limit(PICKER_LIMITS.categories),
    supabase.from("merchants").select("name").eq("workspace_id", workspace.id).order("name", { ascending: true }).limit(PICKER_LIMITS.merchants),
  ]);

  const categories: Record<CategoryType, string[]> = { expense: [], income: [], loan: [] };
  for (const row of categoryRows ?? []) {
    const type: CategoryType = row.type === "income" || row.type === "loan" ? row.type : "expense";
    categories[type].push(row.name);
  }

  return { categories, merchants: (merchantRows ?? []).map((row) => row.name).filter(Boolean) };
}

/** Recent notes matching `query` in the caller's workspace, for the description field's autocomplete. */
export async function searchTransactionNotes(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return [];

  const { data, error } = await supabase
    .from("transactions")
    .select("notes")
    .eq("workspace_id", workspace.id)
    .not("notes", "is", null)
    .ilike("notes", `%${trimmed.replace(/[%_]/g, " ")}%`)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) {
    console.error(error);
    return [];
  }

  const suggestions = new Set(
    (data ?? [])
      .map((row) => row.notes?.trim())
      .filter((value): value is string => Boolean(value) && value.toLowerCase() !== trimmed.toLowerCase()),
  );
  return [...suggestions].slice(0, 8);
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
  if (error) return { error: toActionError(error, "Failed to delete the transaction.") };
  revalidateTransactionPaths();
  return { success: true };
}
