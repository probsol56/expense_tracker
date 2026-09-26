"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceId } from "@/lib/ledger";

const RAISE_EXCEPTION = "P0001";

function toLoanError(error: PostgrestError, fallback: string) {
  // P0001 = messages raised by the loan functions themselves, written for users.
  return error.code === RAISE_EXCEPTION ? error.message : fallback;
}

function revalidateLoanPaths() {
  revalidatePath("/loans");
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function createLoan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add a loan." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before managing loans." };

  const name = String(formData.get("name") ?? "").trim();
  const lender = String(formData.get("lender") ?? "").trim();
  const principalAmount = Number(formData.get("principal_amount"));
  const dateStarted = String(formData.get("date_started") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim();
  const accountId = String(formData.get("account_id") ?? "").trim();

  if (!name || !lender || !Number.isFinite(principalAmount) || principalAmount <= 0) {
    return { error: "Loan name, lender, and valid amount are required." };
  }
  if (!accountId) return { error: "Select which account received the loan." };

  const { error } = await supabase.rpc("create_loan", {
    p_workspace_id: workspace.id,
    p_name: name,
    p_lender: lender,
    p_principal: principalAmount,
    p_date: dateStarted,
    p_notes: notes,
    p_account_id: accountId,
  });
  if (error) return { error: toLoanError(error, "Failed to add the loan.") };

  revalidateLoanPaths();
  return { success: true };
}

export async function updateLoan(loanId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a loan." };

  const name = String(formData.get("name") ?? "").trim();
  const lender = String(formData.get("lender") ?? "").trim();
  const principalAmount = Number(formData.get("principal_amount"));
  const dateStarted = String(formData.get("date_started") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const accountId = String(formData.get("account_id") ?? "").trim();

  if (!name || !lender || !dateStarted || !Number.isFinite(principalAmount) || principalAmount <= 0) {
    return { error: "Loan name, lender, date, and a valid amount are required." };
  }

  const { error } = await supabase.rpc("update_loan", {
    p_loan_id: loanId,
    p_name: name,
    p_lender: lender,
    p_principal: principalAmount,
    p_date: dateStarted,
    p_notes: notes,
    p_account_id: accountId || null,
  });
  if (error) return { error: toLoanError(error, "Failed to update the loan.") };

  revalidateLoanPaths();
  return { success: true };
}

export async function createLoanPayment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to record a loan payment." };

  const loanId = String(formData.get("loan_id") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim();
  const accountId = String(formData.get("account_id") ?? "").trim();

  if (!loanId) return { error: "Select a loan to make a payment." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Payment amount must be greater than zero." };
  }
  if (!accountId) return { error: "Select which account is paying this off." };

  const { error } = await supabase.rpc("record_loan_payment", {
    p_loan_id: loanId,
    p_amount: amount,
    p_date: date,
    p_notes: notes,
    p_account_id: accountId,
  });
  if (error) return { error: toLoanError(error, "Failed to record the payment.") };

  revalidateLoanPaths();
  return { success: true };
}
