import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus, TrendingDown } from "lucide-react";
import { Alert, Badge, Card, Field, Input, NativeSelect, SubmitButton, Textarea } from "@/components/ui";
import { EditDialog } from "@/components/edit-dialog";
import { FigureStrip } from "@/components/figure-strip";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { SignedOutNotice } from "@/components/signed-out-notice";
import { createLoan, createLoanPayment, updateLoan } from "@/app/(app)/loans/actions";
import { UrlPaginationBar } from "@/components/url-pagination-bar";
import { fetchLoanSummary } from "@/lib/list-summaries";
import { LIST_PAGE_SIZE, PICKER_LIMITS, RECENT_REPAYMENTS_PER_LOAN, fetchPage, pageInfo, parsePage } from "@/lib/pagination";
import { parseRecordId } from "@/lib/validations";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { formatEntryDate, money } from "@/lib/utils";
import type { Account, Loan, LoanPayment } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const LOAN_SELECT =
  "id, workspace_id, user_id, name, lender, principal_amount, outstanding_balance, status, date_started, notes, created_at, transaction_id";

type LoanOverview = Loan & { total_paid: number };
type RecentPayment = Pick<LoanPayment, "id" | "amount" | "date" | "notes">;

/** The latest few repayments for each loan on the current page, in one query. */
async function fetchRecentPayments(
  supabase: SupabaseClient,
  loanIds: string[],
): Promise<Map<string, RecentPayment[]>> {
  if (!loanIds.length) return new Map();
  const { data, error } = await supabase
    .from("loans")
    .select("id, loan_payments(id, amount, date, notes)")
    .in("id", loanIds)
    .order("date", { referencedTable: "loan_payments", ascending: false })
    .order("created_at", { referencedTable: "loan_payments", ascending: false })
    .limit(RECENT_REPAYMENTS_PER_LOAN, { referencedTable: "loan_payments" });
  if (error) throw error;
  return new Map((data ?? []).map((loan): [string, RecentPayment[]] => [loan.id, loan.loan_payments]));
}

const LOAN_STATUS_BADGE: Record<Loan["status"], { variant: "warning" | "positive" | "secondary"; label: string }> = {
  active: { variant: "warning", label: "Active" },
  paid: { variant: "positive", label: "Paid off" },
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
  searchParams: Promise<{ edit?: string; error?: string; page?: string }>;
}) {
  const { edit, error, page } = await searchParams;
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();

  if (!user || !supabase || !workspace) {
    return (
      <SignedOutNotice
        title="Sign in to manage loans"
        description="Create a workspace first, then return here to track each loan and its repayments."
      />
    );
  }

  const editingLoanId = parseRecordId(edit);
  const [summary, loans, { data: repayableLoans, error: repayableError }, { data: accounts, error: accountsError }, editing] =
    await Promise.all([
      fetchLoanSummary(supabase, workspace.id),
      fetchPage<LoanOverview>(
        () =>
          supabase
            .from("loan_overview")
            .select(`${LOAN_SELECT}, total_paid`, { count: "exact" })
            .eq("workspace_id", workspace.id)
            .order("date_started", { ascending: false })
            .order("id", { ascending: false }),
        parsePage(page ?? ""),
        LIST_PAGE_SIZE,
      ),
      // Only loans with a balance left can take a repayment.
      supabase
        .from("loans")
        .select("id, name, outstanding_balance")
        .eq("workspace_id", workspace.id)
        .gt("outstanding_balance", 0)
        .order("date_started", { ascending: false })
        .limit(PICKER_LIMITS.loans),
      supabase
        .from("accounts")
        .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(PICKER_LIMITS.accounts),
      editingLoanId
        ? supabase.from("loans").select(LOAN_SELECT).eq("workspace_id", workspace.id).eq("id", editingLoanId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
  if (repayableError) throw repayableError;
  if (accountsError) throw accountsError;
  if (editing.error) throw editing.error;

  const recentPayments = await fetchRecentPayments(supabase, loans.rows.map((loan) => loan.id));
  const accountList = (accounts ?? []) as Account[];
  const editingLoan: Loan | undefined = editing.data ?? undefined;

  let editingLoanAccountId = "";
  if (editingLoan?.transaction_id) {
    const { data: linkedTransaction } = await supabase
      .from("transactions")
      .select("account_id")
      .eq("id", editingLoan.transaction_id)
      .maybeSingle();
    editingLoanAccountId = linkedTransaction?.account_id ?? "";
  }

  const currency = workspace.base_currency || "BDT";
  const accountOptions = accountList.map((account) => (
    <option key={account.id} value={account.id}>
      {account.name} — {money(Number(account.balance), currency)}
    </option>
  ));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={`${workspace.name} · ${loans.totalCount} ${loans.totalCount === 1 ? "loan" : "loans"}`}
        title="Loans"
        description="Track each loan on its own and record repayments against the right balance."
      />

      <FigureStrip
        label="Loan totals"
        figures={[
          { label: "Borrowed", value: money(summary.total_borrowed, currency) },
          { label: "Repaid", value: money(summary.total_repaid, currency), tone: "positive" },
          { label: "Still owed", value: money(summary.total_outstanding, currency) },
        ]}
      />

      {!accountList.length && (
        <Alert tone="warning" className="mb-6">
          You need an account before you can add a loan or record a repayment, since that&apos;s where the cash lands and
          leaves from.{" "}
          <Link href="/accounts" className="font-semibold underline underline-offset-2">
            Add an account
          </Link>
          .
        </Alert>
      )}

      {error && !editingLoan && <Alert className="mb-6">{error}</Alert>}

      {editingLoan && (
        <EditDialog title="Edit loan" closeHref="/loans" error={error}>
          <LoanEditForm loan={editingLoan} accountId={editingLoanAccountId} accounts={accountList} currency={currency} />
        </EditDialog>
      )}

      <Section title="Loan book" className="mb-10">
        <Card className="overflow-hidden">
          {loans.rows.length ? (
            <ul>
              {loans.rows.map((loan) => {
                const paymentsForLoan = recentPayments.get(loan.id) ?? [];
                const totalPaid = Number(loan.total_paid);
                const principal = Number(loan.principal_amount);
                const paidPercent = principal > 0 ? Math.round(Math.min(1, totalPaid / principal) * 100) : 0;
                const statusBadge = LOAN_STATUS_BADGE[loan.status] ?? LOAN_STATUS_BADGE.active;
                return (
                  <li key={loan.id} className="border-b border-rule p-5 last:border-b-0">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-display text-xl font-medium text-fg">{loan.name}</h3>
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-fg-muted">
                          From {loan.lender} · received {formatEntryDate(loan.date_started)}
                        </p>
                      </div>

                      <dl className="grid shrink-0 grid-cols-3 text-right tabular-nums md:w-96">
                        <div className="pr-3">
                          <dt className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Borrowed</dt>
                          <dd className="mt-0.5 font-medium text-fg">{money(principal, currency)}</dd>
                        </div>
                        <div className="border-l border-brass/40 px-3">
                          <dt className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Repaid</dt>
                          <dd className="mt-0.5 font-medium text-moss">{money(totalPaid, currency)}</dd>
                        </div>
                        <div className="border-l border-brass/40 pl-3">
                          <dt className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Owed</dt>
                          <dd className="mt-0.5 font-medium text-fg">{money(Number(loan.outstanding_balance), currency)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-rule/70"
                        role="progressbar"
                        aria-label={`${loan.name} repaid`}
                        aria-valuenow={paidPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="h-full rounded-full bg-moss" style={{ width: `${paidPercent}%` }} />
                      </div>
                      <span className="w-20 shrink-0 text-right text-sm tabular-nums text-fg-muted">{paidPercent}% repaid</span>
                    </div>

                    {paymentsForLoan.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Recent repayments</h4>
                        <ul className="mt-1">
                          {paymentsForLoan.map((payment) => (
                            <li key={payment.id} className="flex items-baseline justify-between gap-4 border-b border-rule py-2 text-sm last:border-b-0">
                              <span className="min-w-0 break-words text-fg-muted">
                                <time dateTime={payment.date} className="tabular-nums">{formatEntryDate(payment.date)}</time>
                                {payment.notes && <span> · {payment.notes}</span>}
                              </span>
                              <span className="shrink-0 font-medium tabular-nums text-fg">{money(Number(payment.amount), currency)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Link
                      href={`/loans?edit=${loan.id}`}
                      className="mt-2 -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-brass-strong transition-colors duration-150 hover:bg-rule/40 hover:text-fg"
                    >
                      <Pencil size={14} aria-hidden="true" /> Edit<span className="sr-only"> {loan.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="font-display text-xl font-medium text-fg">No loans recorded</p>
              <p className="mx-auto mt-2 max-w-prose text-sm text-fg-muted">
                Add a loan below to track what you owe and each repayment against it.
              </p>
            </div>
          )}
          {loans.totalCount > 0 && (
            <div className="border-t border-rule px-5 pb-4">
              <UrlPaginationBar pagination={pageInfo(loans)} />
            </div>
          )}
        </Card>
      </Section>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <Section title="Add a loan">
          <Card className="p-5">
            <form action={handleCreateLoan} className="space-y-4">
              <Field label="Loan name" htmlFor="loan-name">
                <Input id="loan-name" name="name" required placeholder="e.g. Family support, Business loan" />
              </Field>
              <Field label="Lender" htmlFor="loan-lender">
                <Input id="loan-lender" name="lender" required placeholder="e.g. a person, bank or friend" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount" htmlFor="loan-amount">
                  <Input id="loan-amount" name="principal_amount" type="number" min="0.01" step="0.01" inputMode="decimal" required placeholder="0.00" />
                </Field>
                <Field label="Date received" htmlFor="loan-date">
                  <Input id="loan-date" name="date_started" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </Field>
              </div>
              <Field label="Deposit into" htmlFor="loan-account">
                <NativeSelect id="loan-account" name="account_id" required disabled={!accountList.length}>
                  <option value="">Choose an account</option>
                  {accountOptions}
                </NativeSelect>
              </Field>
              <Field label="Notes (optional)" htmlFor="loan-notes">
                <Textarea id="loan-notes" name="notes" rows={3} placeholder="Details about this loan" />
              </Field>
              <SubmitButton loadingText="Adding loan..." disabled={!accountList.length} className="w-full">
                <Plus size={16} aria-hidden="true" /> Add loan
              </SubmitButton>
            </form>
          </Card>
        </Section>

        <Section title="Record a repayment">
          <Card className="p-5">
            <form action={handleCreateLoanPayment} className="space-y-4">
              <Field label="Loan" htmlFor="repayment-loan">
                <NativeSelect id="repayment-loan" name="loan_id" required>
                  <option value="">Choose a loan</option>
                  {(repayableLoans ?? []).map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.name} — {money(Number(loan.outstanding_balance), currency)} owed
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount paid" htmlFor="repayment-amount">
                  <Input id="repayment-amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" required placeholder="0.00" />
                </Field>
                <Field label="Date" htmlFor="repayment-date">
                  <Input id="repayment-date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </Field>
              </div>
              <Field label="Pay from" htmlFor="repayment-account">
                <NativeSelect id="repayment-account" name="account_id" required disabled={!accountList.length}>
                  <option value="">Choose an account</option>
                  {accountOptions}
                </NativeSelect>
              </Field>
              <Field label="Note (optional)" htmlFor="repayment-notes">
                <Textarea id="repayment-notes" name="notes" rows={3} placeholder="Description for this repayment" />
              </Field>
              <SubmitButton loadingText="Saving repayment..." disabled={!accountList.length} className="w-full">
                <TrendingDown size={16} aria-hidden="true" /> Save repayment
              </SubmitButton>
            </form>
          </Card>
        </Section>
      </div>
    </div>
  );
}

function LoanEditForm({
  loan,
  accountId,
  accounts,
  currency,
}: {
  loan: Loan;
  accountId: string;
  accounts: Account[];
  currency: string;
}) {
  return (
    <form action={handleUpdateLoan} className="space-y-4">
      <input type="hidden" name="loan_id" value={loan.id} />
      <Field label="Loan name" htmlFor="edit-loan-name">
        <Input id="edit-loan-name" name="name" required defaultValue={loan.name} />
      </Field>
      <Field label="Lender" htmlFor="edit-loan-lender">
        <Input id="edit-loan-lender" name="lender" required defaultValue={loan.lender} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount" htmlFor="edit-loan-amount">
          <Input
            id="edit-loan-amount"
            name="principal_amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            defaultValue={loan.principal_amount}
          />
        </Field>
        <Field label="Date received" htmlFor="edit-loan-date">
          <Input id="edit-loan-date" name="date_started" type="date" defaultValue={loan.date_started} />
        </Field>
      </div>
      <Field
        label="Deposit into"
        htmlFor="edit-loan-account"
        hint={
          loan.transaction_id
            ? "Moving this to a different account shifts the disbursement there and recalculates both balances."
            : "This loan predates account tracking. Choose an account to post the disbursement now and start tracking its balance impact."
        }
      >
        <NativeSelect
          id="edit-loan-account"
          name="account_id"
          required={Boolean(loan.transaction_id)}
          disabled={!accounts.length}
          defaultValue={accountId}
        >
          <option value="">Choose an account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} — {money(Number(account.balance), currency)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Notes (optional)" htmlFor="edit-loan-notes">
        <Textarea id="edit-loan-notes" name="notes" rows={3} defaultValue={loan.notes ?? ""} placeholder="Details about this loan" />
      </Field>
      <p className="text-sm text-fg-muted">
        Changing the amount adjusts the remaining balance by the difference. Repayments already made aren&apos;t affected.
      </p>
      <SubmitButton loadingText="Saving..." className="w-full">
        Save changes
      </SubmitButton>
    </form>
  );
}
