import type { SupabaseClient } from "@supabase/supabase-js";

const UNIQUE_VIOLATION = "23505";

/**
 * Shared by every server action that writes to the ledger (transactions,
 * loans, loan payments) so workspace resolution and category/merchant
 * lookup stay consistent across them.
 */
export async function getUserWorkspaceId(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ id: string } | null> {
  const { data: owned } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  if (owned) return owned;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!membership?.workspace_id) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", membership.workspace_id)
    .maybeSingle();
  return workspace;
}

export async function resolveCategoryId(
  supabase: SupabaseClient,
  workspaceId: string,
  type: string,
  name: string,
): Promise<string> {
  const normalized = name.trim();
  if (!normalized) throw new Error("Category is required.");

  const { data: existing, error: selectError } = await supabase
    .from("categories")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("type", type)
    .eq("name", normalized)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") throw selectError;
  if (existing?.id) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("categories")
    .insert({ workspace_id: workspaceId, name: normalized, type })
    .select("id")
    .single();

  if (insertError?.code === UNIQUE_VIOLATION) {
    // A concurrent request created it between our select and insert.
    const { data: raced, error: reselectError } = await supabase
      .from("categories")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("type", type)
      .eq("name", normalized)
      .single();
    if (reselectError) throw reselectError;
    return raced.id;
  }
  if (insertError) throw insertError;
  return created.id;
}

export async function resolveMerchantId(
  supabase: SupabaseClient,
  workspaceId: string,
  name: string,
): Promise<string> {
  const normalized = name.trim();
  if (!normalized) throw new Error("Merchant is required.");

  const { data: existing, error: selectError } = await supabase
    .from("merchants")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("name", normalized)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") throw selectError;
  if (existing?.id) return existing.id;

  const { data: created, error: insertError } = await supabase
    .from("merchants")
    .insert({ workspace_id: workspaceId, name: normalized })
    .select("id")
    .single();

  if (insertError?.code === UNIQUE_VIOLATION) {
    // A concurrent request created it between our select and insert.
    const { data: raced, error: reselectError } = await supabase
      .from("merchants")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", normalized)
      .single();
    if (reselectError) throw reselectError;
    return raced.id;
  }
  if (insertError) throw insertError;
  return created.id;
}

/** Confirms `accountId` belongs to `workspaceId` before it's used on a mutation. */
export async function assertAccountInWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  accountId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", accountId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return Boolean(data);
}

/** Confirms `loanId` belongs to `workspaceId` before a transaction is tagged with it. */
export async function assertLoanInWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  loanId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("loans")
    .select("id")
    .eq("id", loanId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * True only for the actual disbursement/repayment transaction a loan or
 * payment posted (see app/(app)/loans/actions.ts) — editing or deleting one
 * would desync the loan's outstanding balance. A transaction merely tagged
 * with a loan_id (see the transaction form's "Linked loan" field) is a plain
 * expense and stays fully editable.
 */
export async function isLoanLedgerTransaction(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<boolean> {
  const [{ data: loan }, { data: payment }] = await Promise.all([
    supabase.from("loans").select("id").eq("transaction_id", transactionId).maybeSingle(),
    supabase.from("loan_payments").select("id").eq("transaction_id", transactionId).maybeSingle(),
  ]);
  return Boolean(loan) || Boolean(payment);
}

/**
 * True only for one of the two linked legs a transfer posted (see
 * app/(app)/accounts/actions.ts) — editing or deleting one independently
 * would desync it from its counterpart leg and the account balances.
 */
export async function isTransferLedgerTransaction(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<boolean> {
  const { data: transfer } = await supabase
    .from("transfers")
    .select("id")
    .or(`from_transaction_id.eq.${transactionId},to_transaction_id.eq.${transactionId}`)
    .maybeSingle();
  return Boolean(transfer);
}
