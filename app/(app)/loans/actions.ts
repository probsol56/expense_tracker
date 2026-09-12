"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAccountInWorkspace, getUserWorkspaceId, resolveCategoryId, resolveMerchantId } from "@/lib/ledger";

const LOAN_CATEGORY = "Loan";

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
  if (!(await assertAccountInWorkspace(supabase, workspace.id, accountId))) {
    return { error: "Select a valid account." };
  }

  const { data: loan, error } = await supabase
    .from("loans")
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      name,
      lender,
      principal_amount: principalAmount,
      outstanding_balance: principalAmount,
      date_started: dateStarted,
      notes: notes || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  try {
    const [categoryId, merchantId] = await Promise.all([
      resolveCategoryId(supabase, workspace.id, "loan", LOAN_CATEGORY),
      resolveMerchantId(supabase, workspace.id, lender),
    ]);

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        account_id: accountId,
        loan_id: loan.id,
        category_id: categoryId,
        merchant_id: merchantId,
        notes: notes || `Loan disbursement from ${lender}`,
        amount: principalAmount,
        date: dateStarted,
        status: "cleared",
      })
      .select("id")
      .single();

    if (transactionError) return { error: transactionError.message };

    const { error: linkError } = await supabase
      .from("loans")
      .update({ transaction_id: transaction.id })
      .eq("id", loan.id);
    if (linkError) return { error: linkError.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post the loan to your accounts." };
  }

  revalidatePath("/loans");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}

export async function updateLoan(loanId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to update a loan." };

  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("id, user_id, workspace_id, principal_amount, outstanding_balance, status, transaction_id")
    .eq("id", loanId)
    .maybeSingle();

  if (loanError) return { error: loanError.message };
  if (!loan) return { error: "Loan not found." };
  if (loan.user_id !== user.id) return { error: "You don't have permission to update this loan." };

  const name = String(formData.get("name") ?? "").trim();
  const lender = String(formData.get("lender") ?? "").trim();
  const principalAmount = Number(formData.get("principal_amount"));
  const dateStarted = String(formData.get("date_started") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const accountId = String(formData.get("account_id") ?? "").trim();

  if (!name || !lender || !dateStarted || !Number.isFinite(principalAmount) || principalAmount <= 0) {
    return { error: "Loan name, lender, date, and a valid amount are required." };
  }
  if (loan.transaction_id) {
    if (!accountId) return { error: "Select which account received the loan." };
    if (!(await assertAccountInWorkspace(supabase, loan.workspace_id, accountId))) {
      return { error: "Select a valid account." };
    }
  }

  // Repayments already made are untouched by this edit — shift the
  // outstanding balance by exactly the change in principal.
  const delta = principalAmount - Number(loan.principal_amount);
  const nextOutstanding = Number(loan.outstanding_balance) + delta;
  if (nextOutstanding < 0) {
    return { error: "New amount is less than what's already been repaid on this loan." };
  }

  try {
    if (loan.transaction_id) {
      const merchantId = await resolveMerchantId(supabase, loan.workspace_id, lender);
      const { error: transactionError } = await supabase
        .from("transactions")
        .update({
          amount: principalAmount,
          date: dateStarted,
          account_id: accountId,
          merchant_id: merchantId,
          notes: notes || `Loan disbursement from ${lender}`,
        })
        .eq("id", loan.transaction_id);
      if (transactionError) return { error: transactionError.message };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update the linked disbursement." };
  }

  const { error: updateError } = await supabase
    .from("loans")
    .update({
      name,
      lender,
      principal_amount: principalAmount,
      outstanding_balance: nextOutstanding,
      date_started: dateStarted,
      notes: notes || null,
      status: loan.status === "closed" ? "closed" : nextOutstanding <= 0 ? "paid" : "active",
    })
    .eq("id", loanId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/loans");
  revalidatePath("/");
  revalidatePath("/transactions");
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

  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .select("id, name, lender, user_id, workspace_id, outstanding_balance")
    .eq("id", loanId)
    .maybeSingle();

  if (loanError) return { error: loanError.message };
  if (!loan) return { error: "Loan not found." };
  if (loan.user_id !== user.id) return { error: "You don't have permission to update this loan." };
  if (amount > Number(loan.outstanding_balance)) {
    return { error: "Payment exceeds the remaining balance for this loan." };
  }
  if (!(await assertAccountInWorkspace(supabase, loan.workspace_id, accountId))) {
    return { error: "Select a valid account." };
  }

  let transactionId: string;
  try {
    const [categoryId, merchantId] = await Promise.all([
      resolveCategoryId(supabase, loan.workspace_id, "loan", LOAN_CATEGORY),
      resolveMerchantId(supabase, loan.workspace_id, loan.lender),
    ]);

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        workspace_id: loan.workspace_id,
        user_id: user.id,
        account_id: accountId,
        loan_id: loanId,
        category_id: categoryId,
        merchant_id: merchantId,
        notes: notes || `Repayment: ${loan.name}`,
        amount: -amount,
        date,
        status: "cleared",
      })
      .select("id")
      .single();

    if (transactionError) return { error: transactionError.message };
    transactionId = transaction.id;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post the repayment to your accounts." };
  }

  const { error: paymentError } = await supabase.from("loan_payments").insert({
    loan_id: loanId,
    workspace_id: loan.workspace_id,
    user_id: user.id,
    amount,
    date,
    notes: notes || null,
    transaction_id: transactionId,
  });

  if (paymentError) return { error: paymentError.message };

  const nextBalance = Number(loan.outstanding_balance) - amount;
  const { error: updateError } = await supabase
    .from("loans")
    .update({
      outstanding_balance: nextBalance,
      status: nextBalance <= 0 ? "paid" : "active",
    })
    .eq("id", loanId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/loans");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}
