import { Repeat } from "lucide-react";
import { EditDialog } from "@/components/edit-dialog";
import { Field, Input, NativeSelect, SubmitButton, Textarea } from "@/components/ui";
import type { Account, Transfer } from "@/lib/types";
import { money } from "@/lib/utils";

type FormAction = (formData: FormData) => Promise<void>;

export function TransferForm({
  accounts,
  currency,
  month,
  transfer,
  createAction,
  updateAction,
}: {
  accounts: Account[];
  currency: string;
  month: string;
  transfer?: Transfer;
  createAction: FormAction;
  updateAction: FormAction;
}) {
  const idPrefix = transfer ? "edit-transfer" : "new-transfer";
  const accountOptions = accounts.map((account) => (
    <option key={account.id} value={account.id}>
      {account.name} — {money(Number(account.balance), currency)}
    </option>
  ));

  return (
    <form action={transfer ? updateAction : createAction} className="space-y-4">
      {transfer && <input type="hidden" name="transfer_id" value={transfer.id} />}
      <input type="hidden" name="month" value={month} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From account" htmlFor={`${idPrefix}-from`}>
          <NativeSelect id={`${idPrefix}-from`} name="from_account_id" defaultValue={transfer?.from_account_id ?? ""}>
            <option value="">External source</option>
            {accountOptions}
          </NativeSelect>
        </Field>
        <Field label="Source name (external only)" htmlFor={`${idPrefix}-source`}>
          <Input id={`${idPrefix}-source`} name="from_account_name" defaultValue={transfer?.from_account_name ?? ""} placeholder="e.g. Other Bank" />
        </Field>
        <Field label="To account" htmlFor={`${idPrefix}-to`}>
          <NativeSelect id={`${idPrefix}-to`} name="to_account_id" defaultValue={transfer?.to_account_id ?? ""}>
            <option value="">External recipient</option>
            {accountOptions}
          </NativeSelect>
        </Field>
        <Field label="Recipient name (external only)" htmlFor={`${idPrefix}-recipient`}>
          <Input id={`${idPrefix}-recipient`} name="to_account_name" defaultValue={transfer?.to_account_name ?? ""} placeholder="e.g. Alex or City Bank" />
        </Field>
        <Field label="Amount" htmlFor={`${idPrefix}-amount`}>
          <Input
            id={`${idPrefix}-amount`}
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            defaultValue={transfer?.amount}
            placeholder="0.00"
          />
        </Field>
        <Field label="Date" htmlFor={`${idPrefix}-date`}>
          <Input id={`${idPrefix}-date`} name="date" type="date" defaultValue={transfer?.date ?? new Date().toISOString().slice(0, 10)} />
        </Field>
      </div>
      <Field label="Notes (optional)" htmlFor={`${idPrefix}-notes`}>
        <Textarea id={`${idPrefix}-notes`} name="notes" rows={2} defaultValue={transfer?.notes ?? ""} placeholder="e.g. ATM withdrawal" />
      </Field>
      <SubmitButton loadingText={transfer ? "Saving..." : "Transferring..."} className="w-full sm:w-auto">
        <Repeat size={16} aria-hidden="true" /> {transfer ? "Save changes" : "Transfer funds"}
      </SubmitButton>
    </form>
  );
}

export function TransferDialog({
  accounts,
  currency,
  month,
  error,
  transfer,
  createAction,
  updateAction,
}: {
  accounts: Account[];
  currency: string;
  month: string;
  error?: string;
  transfer?: Transfer;
  createAction: FormAction;
  updateAction: FormAction;
}) {
  const isEditing = transfer !== undefined;
  return (
    <EditDialog
      title={isEditing ? "Edit transfer" : "Transfer"}
      eyebrow={isEditing ? "Edit entry" : "Move money"}
      closeHref={`/accounts?month=${month}`}
      error={error}
      wide={!isEditing}
    >
      {accounts.length ? (
        <TransferForm
          accounts={accounts}
          currency={currency}
          month={month}
          transfer={transfer}
          createAction={createAction}
          updateAction={updateAction}
        />
      ) : (
        <p className="text-sm text-fg-muted">Add an account before recording a transfer.</p>
      )}
    </EditDialog>
  );
}
