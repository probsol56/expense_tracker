import { Alert } from "@/components/ui";
import { AccountActions } from "@/components/accounts/account-actions";
import { AccountBalanceTable } from "@/components/accounts/account-balance-table";
import { AccountIncomeHistory } from "@/components/accounts/account-income-history";
import { AccountMonthlyHistory } from "@/components/accounts/account-monthly-history";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { AddMoneyDialog } from "@/components/accounts/add-money-dialog";
import { TransferDialog } from "@/components/accounts/transfer-form";
import { TransferHistory } from "@/components/accounts/transfer-history";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { parseSpendingMonth } from "@/lib/dashboard";
import type { AccountIncomeEntry, AccountMonthlyBalance } from "@/lib/account-history";
import type { Page } from "@/lib/pagination";
import type { Account, Transfer } from "@/lib/types";

type AccountAction = (formData: FormData) => Promise<void>;
export type AccountsActionDialog = "income" | "transfer" | "account" | undefined;

export function AccountsContent({
  accounts,
  accountMonthlyBalances,
  incomeHistory,
  transfers,
  currency,
  workspaceName,
  error,
  incomeRecorded,
  incomeUpdated,
  accountAdded,
  transferRecorded,
  selectedMonth,
  actionDialog,
  editingTransfer,
  editingIncome,
  incomeCategories,
  accountAction,
  incomeAction,
  updateIncomeAction,
  transferAction,
  updateTransferAction,
  deleteTransferAction,
}: {
  accounts: Account[];
  accountMonthlyBalances: AccountMonthlyBalance[];
  incomeHistory: Page<AccountIncomeEntry>;
  transfers: Page<Transfer>;
  currency: string;
  workspaceName: string;
  error?: string;
  incomeRecorded: boolean;
  incomeUpdated: boolean;
  accountAdded: boolean;
  transferRecorded: boolean;
  selectedMonth: string;
  actionDialog: AccountsActionDialog;
  editingTransfer?: Transfer;
  editingIncome?: AccountIncomeEntry;
  incomeCategories: string[];
  accountAction: AccountAction;
  incomeAction: AccountAction;
  updateIncomeAction: AccountAction;
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
      {error && !editingTransfer && !editingIncome && !actionDialog && <Alert className="mb-6">{error}</Alert>}
      {incomeRecorded && <Alert className="mb-6" tone="info">Income recorded.</Alert>}
      {incomeUpdated && <Alert className="mb-6" tone="info">Income entry updated.</Alert>}
      {accountAdded && <Alert className="mb-6" tone="info">Account added.</Alert>}
      {transferRecorded && <Alert className="mb-6" tone="info">Transfer recorded.</Alert>}

      <AccountActions month={selectedMonth} />
      <Section title="Balances" className="mb-10">
        <AccountBalanceTable accounts={accounts} currency={currency} />
      </Section>
      <AccountMonthlyHistory
        accounts={accounts}
        balances={accountMonthlyBalances}
        currency={currency}
        month={selectedMonth}
        maxMonth={parseSpendingMonth("", new Date())}
      />
      <AccountIncomeHistory accounts={accounts} currency={currency} entries={incomeHistory} month={selectedMonth} />
      <TransferHistory
        accounts={accounts}
        currency={currency}
        month={selectedMonth}
        transfers={transfers}
        deleteAction={deleteTransferAction}
      />

      {(actionDialog === "income" || editingIncome) && (
        <AddMoneyDialog
          accounts={accounts}
          categories={incomeCategories}
          month={selectedMonth}
          error={error}
          entry={editingIncome}
          action={editingIncome ? updateIncomeAction : incomeAction}
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
