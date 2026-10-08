import { redirect } from "next/navigation";
import { Pencil, Plus, Repeat } from "lucide-react";
import Link from "next/link";
import { Alert, Card, Field, Input, NativeSelect, SubmitButton, Textarea } from "@/components/ui";
import { AccountBalanceRow } from "@/components/account-balance-row";
import { DeleteTransferButton } from "@/components/delete-transfer-button";
import { EditDialog } from "@/components/edit-dialog";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { UrlPaginationBar } from "@/components/url-pagination-bar";
import { LIST_PAGE_SIZE, PICKER_LIMITS, fetchPage, pageInfo, parsePage, type Page } from "@/lib/pagination";
import { formatEntryDate, money } from "@/lib/utils";
import { parseRecordId } from "@/lib/validations";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { createAccount, createTransfer, deleteTransfer, updateTransfer } from "@/app/(app)/accounts/actions";
import type { Account, Transfer } from "@/lib/types";

const TRANSFER_SELECT = "id, workspace_id, user_id, from_account_id, from_account_name, to_account_id, to_account_name, amount, date, notes, created_at";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; editTransfer?: string; page?: string }>;
}) {
  const { error, editTransfer, page } = await searchParams;
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !supabase || !workspace) {
    return (
      <AccountsContent
        accounts={[]}
        transfers={{ rows: [], page: 1, pageSize: LIST_PAGE_SIZE, totalPages: 1, totalCount: 0 }}
        currency="BDT"
        workspaceName="Personal Workspace"
        error={error}
      />
    );
  }

  const editingTransferId = parseRecordId(editTransfer);
  const [{ data: accountRows, error: accountsError }, transfers, editing] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(PICKER_LIMITS.accounts),
    fetchPage<Transfer>(
      () =>
        supabase
          .from("transfers")
          .select(TRANSFER_SELECT, { count: "exact" })
          .eq("workspace_id", workspace.id)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false }),
      parsePage(page ?? ""),
      LIST_PAGE_SIZE,
    ),
    editingTransferId
      ? supabase.from("transfers").select(TRANSFER_SELECT).eq("workspace_id", workspace.id).eq("id", editingTransferId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (accountsError) throw accountsError;
  if (editing.error) throw editing.error;

  return (
    <AccountsContent
      accounts={(accountRows ?? []) as Account[]}
      transfers={transfers}
      currency={workspace.base_currency || "BDT"}
      workspaceName={workspace.name || "Personal Workspace"}
      error={error}
      editingTransfer={editing.data ?? undefined}
    />
  );
}

async function handleCreateAccount(formData: FormData) {
  "use server";
  const result = await createAccount(formData);
  // Only redirect when the URL needs to change (to surface the error). On
  // success we're already on /accounts — revalidatePath (inside the action)
  // refreshes it in place. Redirecting to the same path here blanks the page
  // during the transition on Next 15 (vercel/next.js#73317).
  if (result?.error) {
    redirect(`/accounts?error=${encodeURIComponent(result.error)}`);
  }
}

async function handleCreateTransfer(formData: FormData) {
  "use server";
  const result = await createTransfer(formData);
  if (result?.error) redirect(`/accounts?error=${encodeURIComponent(result.error)}`);
}

async function handleUpdateTransfer(formData: FormData) {
  "use server";
  const transferId = String(formData.get("transfer_id") ?? "");
  const result = await updateTransfer(transferId, formData);
  if (result?.error) redirect(`/accounts?editTransfer=${transferId}&error=${encodeURIComponent(result.error)}`);
  redirect("/accounts");
}

async function handleDeleteTransfer(formData: FormData) {
  "use server";
  const transferId = String(formData.get("transfer_id") ?? "");
  const result = await deleteTransfer(transferId);
  if (result?.error) redirect(`/accounts?error=${encodeURIComponent(result.error)}`);
}

const tableHeadClass = "px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-widest text-fg-muted";

function AccountsContent({
  accounts,
  transfers,
  currency,
  workspaceName,
  error,
  editingTransfer,
}: {
  accounts: Account[];
  transfers: Page<Transfer>;
  currency: string;
  workspaceName: string;
  error?: string;
  editingTransfer?: Transfer;
}) {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const canTransfer = accounts.length >= 1;
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={`${workspaceName} · ${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`}
        title="Accounts"
        description="Balances update from the transactions, loans and repayments you record against each account."
      />

      {error && !editingTransfer && <Alert className="mb-6">{error}</Alert>}

      <Section title="Balances" className="mb-10">
        {accounts.length ? (
          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Account balances</caption>
              <thead className="border-b-2 border-fg/70">
                <tr>
                  <th scope="col" className={tableHeadClass}>Account</th>
                  <th scope="col" className={`${tableHeadClass} hidden sm:table-cell`}>Type</th>
                  <th scope="col" className={`${tableHeadClass} border-l border-brass/40 text-right`}>Balance</th>
                  <th scope="col" className="w-14"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => <AccountBalanceRow key={account.id} account={account} currency={currency} />)}
              </tbody>
              <tfoot className="border-t-2 border-fg/70">
                <tr className="border-b-[3px] border-double border-fg/50">
                  <th scope="row" className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
                    Total
                  </th>
                  <td className="hidden sm:table-cell" />
                  <td
                    className={`border-l border-brass/40 px-4 py-3 text-right font-display text-xl font-medium tabular-nums lining-nums ${totalBalance < 0 ? "text-brick" : "text-fg"
                      }`}
                  >
                    {money(totalBalance, currency)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </Card>
        ) : (
          <Card className="px-6 py-12 text-center">
            <p className="font-display text-xl font-medium text-fg">No accounts yet</p>
            <p className="mx-auto mt-2 max-w-prose text-sm text-fg-muted">
              Add a bank account, card or cash wallet below to start tracking its balance.
            </p>
          </Card>
        )}
      </Section>

      {transfers.totalCount > 0 && (
        <Section title="Transfers" className="mb-10">
          <Card className="overflow-hidden">
            <table className="w-full table-fixed border-collapse text-left sm:table-auto">
              <caption className="sr-only">Transfer history</caption>
              <thead className="border-b-2 border-fg/70">
                <tr>
                  <th scope="col" className={`${tableHeadClass} hidden w-32 sm:table-cell`}>Date</th>
                  <th scope="col" className={tableHeadClass}>From → To</th>
                  <th scope="col" className={`${tableHeadClass} w-32 border-l border-brass/40 text-right sm:w-40`}>Amount</th>
                  <th scope="col" className="w-24"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {transfers.rows.map((transfer) => {
                  const fromAccount = transfer.from_account_id ? accountsById.get(transfer.from_account_id) : undefined;
                  const toAccount = transfer.to_account_id ? accountsById.get(transfer.to_account_id) : undefined;
                  const entryDate = formatEntryDate(transfer.date);
                  return (
                    <tr key={transfer.id} className="border-b border-rule last:border-b-0">
                      <td className="hidden px-4 py-3 align-top text-sm tabular-nums text-fg-muted sm:table-cell">
                        <time dateTime={transfer.date}>{entryDate}</time>
                      </td>
                      <td className="break-words px-4 py-3 align-top">
                        <p className="font-medium text-fg">
                          {fromAccount?.name ?? `External: ${transfer.from_account_name ?? "source"}`} → {toAccount?.name ?? `External: ${transfer.to_account_name ?? "recipient"}`}
                        </p>
                        <p className="text-sm text-fg-muted">
                          <span className="sm:hidden">{entryDate}</span>
                          {transfer.notes && (
                            <>
                              <span className="sm:hidden"> · </span>
                              {transfer.notes}
                            </>
                          )}
                        </p>
                      </td>
                      <td className="border-l border-brass/40 px-4 py-3 text-right align-top font-medium tabular-nums text-fg">
                        {money(Number(transfer.amount), currency)}
                      </td>
                      <td className="py-1.5 pr-2 align-top">
                        <div className="flex justify-end">
                          <Link
                            href={`/accounts?editTransfer=${transfer.id}`}
                            aria-label={`Edit transfer on ${entryDate}`}
                            className="grid h-11 w-11 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-rule/50 hover:text-fg"
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </Link>
                          <DeleteTransferButton transferId={transfer.id} action={handleDeleteTransfer} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-rule px-4 pb-4">
              <UrlPaginationBar pagination={pageInfo(transfers)} />
            </div>
          </Card>
        </Section>
      )}

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <Section title="Add an account">
          <Card className="p-5">
            <form action={handleCreateAccount} className="grid gap-4 sm:grid-cols-2">
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
                <Input
                  id="account-starting-balance"
                  name="starting_balance"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  defaultValue="0"
                />
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
          </Card>
        </Section>

        <Section title="Transfer funds">
          <Card className="p-5">
            {canTransfer ? (
              <TransferForm accounts={accounts} currency={currency} />
            ) : (
              <p className="text-sm text-fg-muted">
                Add an account before recording a transfer.
              </p>
            )}
          </Card>
        </Section>
      </div>

      {editingTransfer && canTransfer && (
        <EditDialog title="Edit transfer" closeHref="/accounts" error={error}>
          <TransferForm accounts={accounts} currency={currency} transfer={editingTransfer} />
        </EditDialog>
      )}
    </div>
  );
}

function TransferForm({
  accounts,
  currency,
  transfer,
}: {
  accounts: Account[];
  currency: string;
  transfer?: Transfer;
}) {
  // The inline form and the edit dialog render together, so ids are scoped per mode.
  const idPrefix = transfer ? "edit-transfer" : "new-transfer";
  const accountOptions = accounts.map((account) => (
    <option key={account.id} value={account.id}>
      {account.name} — {money(Number(account.balance), currency)}
    </option>
  ));

  return (
    <form action={transfer ? handleUpdateTransfer : handleCreateTransfer} className="space-y-4">
      {transfer && <input type="hidden" name="transfer_id" value={transfer.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From account" htmlFor={`${idPrefix}-from`}>
          <NativeSelect id={`${idPrefix}-from`} name="from_account_id" defaultValue={transfer?.from_account_id ?? ""}>
            <option value="">External source</option>
            {accountOptions}
          </NativeSelect>
        </Field>
        <Field label="Source name (external only)" htmlFor={`${idPrefix}-source`}>
          <Input
            id={`${idPrefix}-source`}
            name="from_account_name"
            defaultValue={transfer?.from_account_name ?? ""}
            placeholder="e.g. Other Bank"
          />
        </Field>
        <Field label="To account" htmlFor={`${idPrefix}-to`}>
          <NativeSelect id={`${idPrefix}-to`} name="to_account_id" defaultValue={transfer?.to_account_id ?? ""}>
            <option value="">External recipient</option>
            {accountOptions}
          </NativeSelect>
        </Field>
        <Field label="Recipient name (external only)" htmlFor={`${idPrefix}-recipient`}>
          <Input
            id={`${idPrefix}-recipient`}
            name="to_account_name"
            defaultValue={transfer?.to_account_name ?? ""}
            placeholder="e.g. Alex or City Bank"
          />
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
          <Input
            id={`${idPrefix}-date`}
            name="date"
            type="date"
            defaultValue={transfer?.date ?? new Date().toISOString().slice(0, 10)}
          />
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
