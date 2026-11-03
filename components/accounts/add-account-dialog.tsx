import { Plus } from "lucide-react";
import { EditDialog } from "@/components/edit-dialog";
import { Field, Input, NativeSelect, SubmitButton } from "@/components/ui";

type FormAction = (formData: FormData) => Promise<void>;

export function AddAccountDialog({
  month,
  error,
  action,
}: {
  month: string;
  error?: string;
  action: FormAction;
}) {
  return (
    <EditDialog title="Add account" eyebrow="New account" closeHref={`/accounts?month=${month}`} error={error}>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="month" value={month} />
        <Field label="Account name" htmlFor="account-name" className="sm:col-span-2">
          <Input id="account-name" name="name" required placeholder="e.g. Main checking, Cash wallet" />
        </Field>
        <Field label="Type" htmlFor="account-type">
          <NativeSelect id="account-type" name="account_type" defaultValue="checking">
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="credit_card">Credit card</option>
            <option value="cash">Cash</option>
            <option value="investment">Investment</option>
          </NativeSelect>
        </Field>
        <Field label="Starting balance" htmlFor="account-starting-balance">
          <Input id="account-starting-balance" name="starting_balance" type="number" step="0.01" inputMode="decimal" defaultValue="0" />
        </Field>
        <Field label="Institution (optional)" htmlFor="account-institution" className="sm:col-span-2">
          <Input id="account-institution" name="institution" placeholder="e.g. City Bank" />
        </Field>
        <div className="sm:col-span-2">
          <SubmitButton loadingText="Adding account..." className="w-full sm:w-auto">
            <Plus size={16} aria-hidden="true" /> Add account
          </SubmitButton>
        </div>
      </form>
    </EditDialog>
  );
}
