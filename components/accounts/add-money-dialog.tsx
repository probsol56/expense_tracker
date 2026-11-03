import { Plus } from "lucide-react";
import { EditDialog } from "@/components/edit-dialog";
import { Alert, Field, Input, NativeSelect, SubmitButton, Textarea } from "@/components/ui";
import type { Account } from "@/lib/types";

type FormAction = (formData: FormData) => Promise<void>;

export function AddMoneyDialog({
  accounts,
  categories,
  month,
  error,
  action,
}: {
  accounts: Account[];
  categories: string[];
  month: string;
  error?: string;
  action: FormAction;
}) {
  return (
    <EditDialog title="Add money" eyebrow="New income" closeHref={`/accounts?month=${month}`} error={error} wide>
      {accounts.length ? (
        <form action={action} className="space-y-4">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="type" value="income" />
          <input type="hidden" name="items_json" value="[]" />
          <input type="hidden" name="loan_id" value="" />
          <input type="hidden" name="tax_amount" value="" />
          <input type="hidden" name="discount_amount" value="" />
          <input type="hidden" name="receipt_path" value="" />
          <p className="max-w-prose text-sm text-fg-muted">
            Use for money earned or received. To move your own money between accounts, choose Transfer.
          </p>
          <Field label="Income source" htmlFor="income-source">
            <Input id="income-source" name="merchant" required placeholder="e.g. Employer or client" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="income-category">
              <Input
                id="income-category"
                name="category"
                list="income-category-options"
                required
                placeholder="Choose or enter a category"
              />
              <datalist id="income-category-options">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
            </Field>
            <Field label="Amount" htmlFor="income-amount">
              <Input id="income-amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" required placeholder="0.00" />
            </Field>
            <Field label="Deposit to" htmlFor="income-account">
              <NativeSelect id="income-account" name="account_id" defaultValue={accounts[0]?.id}>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Date" htmlFor="income-date">
              <Input id="income-date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </Field>
          </div>
          <Field label="Note (optional)" htmlFor="income-note">
            <Textarea id="income-note" name="description" rows={2} placeholder="Add a reference or detail" />
          </Field>
          <SubmitButton loadingText="Recording income..." className="w-full sm:w-auto">
            <Plus size={16} aria-hidden="true" /> Record income
          </SubmitButton>
        </form>
      ) : (
        <Alert tone="info">Add an account before recording income.</Alert>
      )}
    </EditDialog>
  );
}
