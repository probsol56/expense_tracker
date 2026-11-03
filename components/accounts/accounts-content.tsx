import { Alert } from "@/components/ui";
import { AccountActions } from "@/components/accounts/account-actions";
import { AccountBalanceTable } from "@/components/accounts/account-balance-table";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { AddMoneyDialog } from "@/components/accounts/add-money-dialog";
import { TransferDialog } from "@/components/accounts/transfer-form";
import { TransferHistory } from "@/components/accounts/transfer-history";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import type { Page } from "@/lib/pagination";
import type { Account, Transfer } from "@/lib/types";

type AccountAction = (formData: FormData) => Promise<void>;
export type AccountsActionDialog = "income" | "transfer" | "account" | undefined;

export function AccountsContent({
  accounts,
  transfers,
  currency,
  workspaceName,
  error,
  incomeRecorded,
  accountAdded,
  transferRecorded,
  selectedMonth,
  actionDialog,
  editingTransfer,
  incomeCategories,
  accountAction,
  incomeAction,
  transferAction,
  updateTransferAction,
  deleteTransferAction,
}: {
  accounts: Account[];
  transfers: Page<Transfer>;
  currency: string;
  workspaceName: string;
  error?: string;
  incomeRecorded: boolean;
  accountAdded: boolean;
  transferRecorded: boolean;
  selectedMonth: string;
  actionDialog: AccountsActionDialog;
  editingTransfer?: Transfer;
  incomeCategories: string[];
  accountAction: AccountAction;
  incomeAction: AccountAction;
  transferAction: AccountAction;
  updateTransferAction: AccountAction;
  deleteTransferAction: AccountAction;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={`${workspaceName} · ${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}`}
        title="Accounts"
        description="Balances update from the transactions, loans and repayments you record against each account."
      />
      {error && !editingTransfer && !actionDialog && <Alert className="mb-6">{error}</Alert>}
      {incomeRecorded && <Alert className="mb-6" tone="info">Income recorded.</Alert>}
      {accountAdded && <Alert className="mb-6" tone="info">Account added.</Alert>}
      {transferRecorded && <Alert className="mb-6" tone="info">Transfer recorded.</Alert>}

      <AccountActions month={selectedMonth} />
      <Section title="Balances" className="mb-10">
        <AccountBalanceTable accounts={accounts} currency={currency} />
      </Section>
      <TransferHistory
        accounts={accounts}
        currency={currency}
        month={selectedMonth}
        transfers={transfers}
        deleteAction={deleteTransferAction}
      />

      {actionDialog === "income" && (
        <AddMoneyDialog
          accounts={accounts}
          categories={incomeCategories}
          month={selectedMonth}
          error={error}
          action={incomeAction}
        />
      )}
      {actionDialog === "account" && (
        <AddAccountDialog month={selectedMonth} error={error} action={accountAction} />
      )}
      {(actionDialog === "transfer" || editingTransfer) && (
        <TransferDialog
          accounts={accounts}
          currency={currency}
          month={selectedMonth}
          error={error}
          transfer={editingTransfer}
          createAction={transferAction}
          updateAction={updateTransferAction}
        />
      )}
    </div>
  );
}
