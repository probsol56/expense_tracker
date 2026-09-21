import Link from "next/link";
import { redirect } from "next/navigation";
import { Landmark, Pencil, Plus, TrendingDown } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { createLoan, createLoanPayment, updateLoan } from "@/app/(app)/loans/actions";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { money } from "@/lib/utils";
import type { Account, Loan, LoanPayment } from "@/lib/types";

const LOAN_STATUS_BADGE: Record<Loan["status"], { variant: "amber" | "emerald" | "secondary"; label: string }> = {
  active: { variant: "amber", label: "Active" },
  paid: { variant: "emerald", label: "Paid off" },
  closed: { variant: "secondary", label: "Closed" },
};

async function handleCreateLoan(formData: FormData) {
  "use server";
  const result = await createLoan(formData);
  // Only redirect when the URL needs to change (to surface the error). On
  // success we're already on /loans — revalidatePath (inside the action)
  // refreshes it in place. Redirecting to the same path here blanks the page
  // during the transition on Next 15 (vercel/next.js#73317).
  if (result?.error) redirect(`/loans?error=${encodeURIComponent(result.error)}`);
}

async function handleCreateLoanPayment(formData: FormData) {
  "use server";
  const result = await createLoanPayment(formData);
  if (result?.error) redirect(`/loans?error=${encodeURIComponent(result.error)}`);
}

async function handleUpdateLoan(formData: FormData) {
  "use server";
  const loanId = String(formData.get("loan_id") ?? "");
  const result = await updateLoan(loanId, formData);
  if (result?.error) redirect(`/loans?edit=${loanId}&error=${encodeURIComponent(result.error)}`);
  redirect("/loans");
}

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string }>;
}) {
  const { edit: editingLoanId, error } = await searchParams;
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();

  if (!user || !supabase || !workspace) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-slate-900">Sign in to manage loans</h1>
        <p className="mt-2 text-sm text-slate-500">
          Create a workspace first, then return here to track each loan and its repayments.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Go to login
        </Link>
      </div>
    );
  }

  const [{ data: loans }, { data: payments }, { data: accounts }] = await Promise.all([
    supabase
      .from("loans")
      .select("id, name, lender, principal_amount, outstanding_balance, status, date_started, notes, created_at, transaction_id")
      .eq("workspace_id", workspace.id)
      .order("date_started", { ascending: false }),
    supabase
      .from("loan_payments")
      .select("id, loan_id, amount, date, notes, created_at")
      .eq("workspace_id", workspace.id)
      .order("date", { ascending: false }),
    supabase
      .from("accounts")
      .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }),
  ]);

  const loanList = (loans ?? []) as Loan[];
  const paymentList = (payments ?? []) as LoanPayment[];
  const accountList = (accounts ?? []) as Account[];
  const totalBorrowed = loanList.reduce((sum, loan) => sum + Number(loan.principal_amount), 0);
  const totalRepaid = paymentList.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remainingBalance = loanList.reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);
  const editingLoan = editingLoanId ? loanList.find((loan) => loan.id === editingLoanId) : undefined;

  let editingLoanAccountId = "";
  if (editingLoan?.transaction_id) {
    const { data: linkedTransaction } = await supabase
      .from("transactions")
      .select("account_id")
      .eq("id", editingLoan.transaction_id)
      .maybeSingle();
    editingLoanAccountId = linkedTransaction?.account_id ?? "";
  }

  return (
    <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
              <Landmark size={12} /> Loan tracking
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Loans & repayments
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Track each loan separately and record repayments against the correct balance.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Borrowed</span>
              <Landmark size={16} className="text-amber-600" />
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{money(totalBorrowed, workspace.base_currency || "BDT")}</div>
          </Card>

          <Card className="p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Repaid</span>
              <TrendingDown size={16} className="text-teal-600" />
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{money(totalRepaid, workspace.base_currency || "BDT")}</div>
          </Card>

          <Card className="p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remaining</span>
              <Landmark size={16} className="text-coral-600" />
            </div>
            <div className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{money(remainingBalance, workspace.base_currency || "BDT")}</div>
          </Card>
        </div>

        {!accountList.length && (
          <div className="mt-8 rounded-2xl border border-amber-200/70 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            You need an account before you can add a loan or record a repayment — that&apos;s where the cash lands and leaves from.{" "}
            <Link href="/accounts" className="font-semibold underline underline-offset-2">Add an account</Link>.
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200/70 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          {editingLoan ? (
            <Card className="shadow-card">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-ink-900/60">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit loan</h2>
                <Link href="/loans" className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</Link>
              </div>
              <div className="p-5">
                <form action={handleUpdateLoan} className="space-y-4">
                  <input type="hidden" name="loan_id" value={editingLoan.id} />
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Loan name</label>
                    <Input name="name" required defaultValue={editingLoan.name} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lender</label>
                    <Input name="lender" required defaultValue={editingLoan.lender} className="h-11" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</label>
                      <Input name="principal_amount" type="number" min="0.01" step="0.01" required defaultValue={editingLoan.principal_amount} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date received</label>
                      <Input name="date_started" type="date" defaultValue={editingLoan.date_started} className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Deposit into</label>
                    <select
                      name="account_id"
                      required={Boolean(editingLoan.transaction_id)}
                      disabled={!accountList.length}
                      defaultValue={editingLoanAccountId}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Choose an account</option>
                      {accountList.map((account) => (
                        <option key={account.id} value={account.id}>{account.name} — {money(Number(account.balance), workspace.base_currency || "BDT")}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      {editingLoan.transaction_id
                        ? "Moving this to a different account shifts the disbursement there and recalculates both balances."
                        : "This loan predates account tracking. Choose an account to post the disbursement now and start tracking its balance impact."}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</label>
                    <textarea name="notes" rows={3} defaultValue={editingLoan.notes ?? ""} className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-150 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 dark:border-slate-700 dark:bg-ink-800/70 dark:text-slate-100 dark:placeholder:text-slate-500" placeholder="Optional details about this loan" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Changing the amount adjusts the remaining balance by the difference — repayments already made aren&apos;t affected.
                  </p>
                  <Button type="submit" className="w-full justify-center bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                    Save changes
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="shadow-card">
              <div className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-ink-900/60">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add a loan</h2>
              </div>
              <div className="p-5">
                <form action={handleCreateLoan} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Loan name</label>
                    <Input name="name" required className="h-11" placeholder="e.g. Family support, Business loan" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lender</label>
                    <Input name="lender" required className="h-11" placeholder="e.g. X Person, Bank, Friend" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</label>
                      <Input name="principal_amount" type="number" min="0.01" step="0.01" required className="h-11" placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date received</label>
                      <Input name="date_started" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Deposit into</label>
                    <select name="account_id" required disabled={!accountList.length} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                      <option value="">Choose an account</option>
                      {accountList.map((account) => (
                        <option key={account.id} value={account.id}>{account.name} — {money(Number(account.balance), workspace.base_currency || "BDT")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</label>
                    <textarea name="notes" rows={3} className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-150 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 dark:border-slate-700 dark:bg-ink-800/70 dark:text-slate-100 dark:placeholder:text-slate-500" placeholder="Optional details about this loan" />
                  </div>
                  <Button type="submit" disabled={!accountList.length} className="w-full justify-center bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                    <Plus size={15} className="mr-2 inline" /> Add loan
                  </Button>
                </form>
              </div>
            </Card>
          )}

          <Card className="shadow-card">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-ink-900/60">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Record a repayment</h2>
            </div>
            <div className="p-5">
              <form action={handleCreateLoanPayment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select loan</label>
                  <select name="loan_id" required className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <option value="">Choose a loan</option>
                    {loanList.map((loan) => (
                      <option key={loan.id} value={loan.id}>{loan.name} — {money(Number(loan.outstanding_balance), workspace.base_currency || "BDT")} remaining</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount paid</label>
                    <Input name="amount" type="number" min="0.01" step="0.01" required className="h-11" placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</label>
                    <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="h-11" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pay from</label>
                  <select name="account_id" required disabled={!accountList.length} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <option value="">Choose an account</option>
                    {accountList.map((account) => (
                      <option key={account.id} value={account.id}>{account.name} — {money(Number(account.balance), workspace.base_currency || "BDT")}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Note</label>
                  <textarea name="notes" rows={3} className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-150 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 dark:border-slate-700 dark:bg-ink-800/70 dark:text-slate-100 dark:placeholder:text-slate-500" placeholder="Optional description for this repayment" />
                </div>
                <Button type="submit" disabled={!accountList.length} className="w-full justify-center bg-emerald-600 text-white hover:bg-emerald-500">
                  <TrendingDown size={15} className="mr-2 inline" /> Save repayment
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="overflow-hidden shadow-card">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-ink-900/60">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Loan list</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {loanList.length ? (
                loanList.map((loan) => {
                  const paymentsForLoan = paymentList.filter((payment) => payment.loan_id === loan.id);
                  const totalPaid = paymentsForLoan.reduce((sum, payment) => sum + Number(payment.amount), 0);
                  const principal = Number(loan.principal_amount);
                  const paidRatio = principal > 0 ? Math.min(1, totalPaid / principal) : 0;
                  const statusBadge = LOAN_STATUS_BADGE[loan.status] ?? LOAN_STATUS_BADGE.active;
                  return (
                    <div key={loan.id} className="group p-5 transition-colors hover:bg-slate-50/60 dark:hover:bg-ink-900/40">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-slate-100 dark:text-slate-900">
                            <Landmark size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{loan.name}</h3>
                              <Badge variant={statusBadge.variant} size="sm">{statusBadge.label}</Badge>
                              <Link
                                href={`/loans?edit=${loan.id}`}
                                aria-label={`Edit ${loan.name}`}
                                className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-semibold text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 dark:hover:bg-ink-800 dark:hover:text-slate-200"
                              >
                                <Pencil size={12} /> Edit
                              </Link>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Lender: {loan.lender}</p>
                          </div>
                        </div>
                        <div className="grid gap-2 text-right text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400">Borrowed</div>
                            <div className="font-bold">{money(principal, workspace.base_currency || "BDT")}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400">Paid</div>
                            <div className="font-bold text-teal-600 dark:text-teal-400">{money(totalPaid, workspace.base_currency || "BDT")}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400">Remaining</div>
                            <div className="font-bold text-coral-600 dark:text-rose-400">{money(Number(loan.outstanding_balance), workspace.base_currency || "BDT")}</div>
                          </div>
                        </div>
                      </div>

                      <div
                        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                        role="progressbar"
                        aria-label={`${loan.name} repayment progress`}
                        aria-valuenow={Math.round(paidRatio * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-teal-500 transition-[width] duration-300"
                          style={{ width: `${paidRatio * 100}%` }}
                        />
                      </div>

                      {paymentsForLoan.length > 0 && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Repayments</div>
                          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            {paymentsForLoan.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-slate-800/70">
                                <div>
                                  <div className="font-medium">{money(Number(payment.amount), workspace.base_currency || "BDT")}</div>
                                  {payment.notes && <div className="text-[11px] text-slate-400">{payment.notes}</div>}
                                </div>
                                <div className="text-[11px] text-slate-400">{new Date(payment.date).toLocaleDateString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No loans yet. Add the first loan to start tracking repayments.</div>
              )}
            </div>
          </Card>
        </div>
    </div>
  );
}
