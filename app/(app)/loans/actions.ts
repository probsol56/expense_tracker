"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserWorkspaceId } from "@/lib/ledger";
import { loanPaymentSchema, loanSchema, loanUpdateSchema } from "@/lib/validations";
import { toActionError } from "@/lib/errors";

function revalidateLoanPaths() {
  revalidatePath("/loans");
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function createLoan(formData: FormData) {
  const parsed = loanSchema.safeParse({
    ...Object.fromEntries(formData),
    date_started: formData.get("date_started") || new Date().toISOString().slice(0, 10),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the loan details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to add a loan." };

  const workspace = await getUserWorkspaceId(supabase, user.id);
  if (!workspace) return { error: "Create a workspace before managing loans." };

  const { name, lender, principal_amount, date_started, notes, account_id } = parsed.data;
  const { error } = await supabase.rpc("create_loan", {
    p_workspace_id: workspace.id,
    p_name: name,
    p_lender: lender,
    p_principal: principal_amount,
    p_date: date_started,
    p_notes: notes ?? "",
    p_account_id: account_id,
  });
  if (error) return { error: toActionError(error, "Failed to add the loan.") };

  revalidateLoanPaths();
  return { success: true };
}

export async function updateLoan(loanId: string, formData: FormData) {
  const parsed = loanUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the loan details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a loan." };

  const { name, lender, principal_amount, date_started, notes, account_id } = parsed.data;
  const { error } = await supabase.rpc("update_loan", {
    p_loan_id: loanId,
    p_name: name,
    p_lender: lender,
    p_principal: principal_amount,
    p_date: date_started,
    p_notes: notes ?? "",
    p_account_id: account_id || null,
  });
  if (error) return { error: toActionError(error, "Failed to update the loan.") };

  revalidateLoanPaths();
  return { success: true };
}

export async function createLoanPayment(formData: FormData) {
  const parsed = loanPaymentSchema.safeParse({
    ...Object.fromEntries(formData),
    date: formData.get("date") || new Date().toISOString().slice(0, 10),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the payment details and try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to record a loan payment." };

  const { loan_id, amount, date, notes, account_id } = parsed.data;
  const { error } = await supabase.rpc("record_loan_payment", {
    p_loan_id: loan_id,
    p_amount: amount,
    p_date: date,
    p_notes: notes ?? "",
    p_account_id: account_id,
  });
  if (error) return { error: toActionError(error, "Failed to record the payment.") };

  revalidateLoanPaths();
  return { success: true };
}
