import { submitLoanUpdate } from "@/app/(app)/loans/actions";
import { Field, Input, NativeSelect, SubmitButton, Textarea } from "@/components/ui";
import { money } from "@/lib/utils";
import type { Account, Loan } from "@/lib/types";

export function LoanEditForm({
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
        <form action={submitLoanUpdate} className="space-y-4">
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