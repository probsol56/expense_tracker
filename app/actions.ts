"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { transactionSchema } from "@/lib/validations";
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
  const computedAmount = items.length
    ? items.reduce((total, item) => total + item.total_price, 0)
    : rawAmount;
  const normalized = { ...rawData, amount: Number.isFinite(computedAmount) ? Math.abs(computedAmount) : rawData.amount };
  return { type, items, parsed: transactionSchema.safeParse(normalized) };
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
  if (error) return { error: toActionError(error, "Failed to save transaction.") };

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
  if (error) return { error: toActionError(error, "Failed to update transaction.") };

  revalidateTransactionPaths();
  return { success: true };
}

/** Line items for a transaction being edited — RLS scopes this to the caller's workspace. */
export async function getTransactionItemsForEdit(transactionId: string): Promise<TransactionItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_items")
    .select("id, name, quantity, unit_price, total_price")
    .eq("transaction_id", transactionId);
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.unit_price) || 0,
    total_price: Number(item.total_price) || 0,
  }));
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
