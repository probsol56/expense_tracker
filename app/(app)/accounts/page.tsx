import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AccountsContent, type AccountsActionDialog } from "@/components/accounts/accounts-content";
import { LIST_PAGE_SIZE, PICKER_LIMITS, fetchPage, parsePage } from "@/lib/pagination";
import { getMonthRangeForKey, parseSpendingMonth } from "@/lib/dashboard";
import { parseRecordId } from "@/lib/validations";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import {
  fetchAccountIncomeForEdit,
  fetchAccountIncomeHistory,
  fetchAccountMonthlyHistory,
} from "@/lib/account-history";
import { createAccount, createTransfer, deleteTransfer, updateAccountIncome, updateTransfer } from "@/app/(app)/accounts/actions";
import { createTransaction } from "@/app/actions";
import type { Account, Transfer } from "@/lib/types";

const TRANSFER_SELECT =
  "id, workspace_id, user_id, from_account_id, from_account_name, to_account_id, to_account_name, amount, date, notes, created_at";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    editTransfer?: string;
    editIncome?: string;
    addIncome?: string;
    transfer?: string;
    addAccount?: string;
    incomeRecorded?: string;
    incomeUpdated?: string;
    accountAdded?: string;
    transferRecorded?: string;
    month?: string;
    page?: string;
    incomePage?: string;
  }>;
}) {
  const params = await searchParams;
  const selectedMonth = parseSpendingMonth(params.month ?? "", new Date());
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();

  if (!user || !supabase || !workspace) {
    return (
      <AccountsContent
        accounts={[]}
        accountMonthlyBalances={[]}
        incomeHistory={{ rows: [], page: 1, pageSize: LIST_PAGE_SIZE, totalPages: 1, totalCount: 0 }}
        transfers={{ rows: [], page: 1, pageSize: LIST_PAGE_SIZE, totalPages: 1, totalCount: 0 }}
        currency="BDT"
        workspaceName="Personal Workspace"
        error={params.error}
        incomeRecorded={params.incomeRecorded === "1"}
        incomeUpdated={params.incomeUpdated === "1"}
        accountAdded={params.accountAdded === "1"}
        transferRecorded={params.transferRecorded === "1"}
        selectedMonth={selectedMonth}
        actionDialog={getActionDialog(params)}
        incomeCategories={[]}
        accountAction={handleCreateAccount}
        incomeAction={handleCreateIncome}
        updateIncomeAction={handleUpdateIncome}
        transferAction={handleCreateTransfer}
        updateTransferAction={handleUpdateTransfer}
        deleteTransferAction={handleDeleteTransfer}
      />
    );
  }

  const editingTransferId = parseRecordId(params.editTransfer);
  const editingIncomeId = parseRecordId(params.editIncome);
  const transferDateRange = getMonthRangeForKey(selectedMonth);
  const [
    { data: accountRows, error: accountsError },
    accountMonthlyBalances,
    incomeHistory,
    editingIncome,
    transfers,
    editing,
    { data: categoryRows, error: categoriesError },
  ] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(PICKER_LIMITS.accounts),
      fetchAccountMonthlyHistory(supabase, workspace.id, selectedMonth),
      fetchAccountIncomeHistory(
        supabase,
        workspace.id,
        selectedMonth,
        parsePage(params.incomePage ?? ""),
        LIST_PAGE_SIZE,
      ),
      editingIncomeId
        ? fetchAccountIncomeForEdit(supabase, workspace.id, editingIncomeId)
        : Promise.resolve(null),
      fetchPage<Transfer>(
        () =>
          supabase
            .from("transfers")
            .select(TRANSFER_SELECT, { count: "exact" })
            .eq("workspace_id", workspace.id)
            .gte("date", transferDateRange.from)
            .lt("date", transferDateRange.to)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id", { ascending: false }),
        parsePage(params.page ?? ""),
        LIST_PAGE_SIZE,
      ),
      editingTransferId
        ? supabase
            .from("transfers")
            .select(TRANSFER_SELECT)
            .eq("workspace_id", workspace.id)
            .eq("id", editingTransferId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("categories")
        .select("name")
        .eq("workspace_id", workspace.id)
        .eq("type", "income")
        .order("name", { ascending: true })
        .limit(PICKER_LIMITS.categories),
    ]);

  if (accountsError) throw accountsError;
  if (categoriesError) throw categoriesError;
  if (editing.error) throw editing.error;
  if (editingIncomeId && !editingIncome) {
    redirect(`/accounts?month=${selectedMonth}&error=${encodeURIComponent("This add money entry is no longer available.")}`);
  }

  return (
    <AccountsContent
      accounts={(accountRows ?? []) as Account[]}
      accountMonthlyBalances={accountMonthlyBalances}
      transfers={transfers}
      currency={workspace.base_currency || "BDT"}
      workspaceName={workspace.name || "Personal Workspace"}
      error={params.error}
      incomeRecorded={params.incomeRecorded === "1"}
      incomeUpdated={params.incomeUpdated === "1"}
      accountAdded={params.accountAdded === "1"}
      transferRecorded={params.transferRecorded === "1"}
      selectedMonth={selectedMonth}
      actionDialog={getActionDialog(params)}
      editingTransfer={editing.data ?? undefined}
      editingIncome={editingIncome ?? undefined}
      incomeHistory={incomeHistory}
      incomeCategories={(categoryRows ?? []).map((category) => category.name)}
      accountAction={handleCreateAccount}
      incomeAction={handleCreateIncome}
      updateIncomeAction={handleUpdateIncome}
      transferAction={handleCreateTransfer}
      updateTransferAction={handleUpdateTransfer}
      deleteTransferAction={handleDeleteTransfer}
    />
  );
}

function getActionDialog(params: { addIncome?: string; transfer?: string; addAccount?: string }): AccountsActionDialog {
  if (params.addIncome === "1") return "income";
  if (params.transfer === "1") return "transfer";
  if (params.addAccount === "1") return "account";
  return undefined;
}

async function handleCreateAccount(formData: FormData) {
  "use server";
  const selectedMonth = parseSpendingMonth(String(formData.get("month") ?? ""), new Date());
  const result = await createAccount(formData);
  if ("error" in result && result.error) redirect(`/accounts?addAccount=1&month=${selectedMonth}&error=${encodeURIComponent(result.error)}`);
  redirect(`/accounts?month=${selectedMonth}&accountAdded=1`);
}

async function handleCreateIncome(formData: FormData) {
  "use server";
  const selectedMonth = parseSpendingMonth(String(formData.get("month") ?? ""), new Date());
  const result = await createTransaction(formData);
  if ("error" in result && result.error) redirect(`/accounts?addIncome=1&month=${selectedMonth}&error=${encodeURIComponent(result.error)}`);
  revalidatePath("/accounts");
  redirect(`/accounts?month=${selectedMonth}&incomeRecorded=1`);
}

async function handleUpdateIncome(formData: FormData) {
  "use server";
  const selectedMonth = parseSpendingMonth(String(formData.get("month") ?? ""), new Date());
  const transactionId = parseRecordId(String(formData.get("transaction_id") ?? ""));
  if (!transactionId) {
    redirect(`/accounts?month=${selectedMonth}&error=${encodeURIComponent("Select a valid income entry.")}`);
  }
  const result = await updateAccountIncome(transactionId, formData);
  if ("error" in result && result.error) {
    redirect(`/accounts?editIncome=${transactionId}&month=${selectedMonth}&error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath("/accounts");
  redirect(`/accounts?month=${selectedMonth}&incomeUpdated=1`);
}

async function handleCreateTransfer(formData: FormData) {
  "use server";
  const selectedMonth = parseSpendingMonth(String(formData.get("month") ?? ""), new Date());
  const result = await createTransfer(formData);
  if ("error" in result && result.error) redirect(`/accounts?transfer=1&month=${selectedMonth}&error=${encodeURIComponent(result.error)}`);
  redirect(`/accounts?month=${selectedMonth}&transferRecorded=1`);
}

async function handleUpdateTransfer(formData: FormData) {
  "use server";
  const transferId = String(formData.get("transfer_id") ?? "");
  const selectedMonth = parseSpendingMonth(String(formData.get("month") ?? ""), new Date());
  const result = await updateTransfer(transferId, formData);
  if ("error" in result && result.error) redirect(`/accounts?editTransfer=${transferId}&month=${selectedMonth}&error=${encodeURIComponent(result.error)}`);
  redirect(`/accounts?month=${selectedMonth}`);
}

async function handleDeleteTransfer(formData: FormData) {
  "use server";
  const transferId = String(formData.get("transfer_id") ?? "");
  const selectedMonth = parseSpendingMonth(String(formData.get("month") ?? ""), new Date());
  const result = await deleteTransfer(transferId);
  if ("error" in result && result.error) redirect(`/accounts?month=${selectedMonth}&error=${encodeURIComponent(result.error)}`);
}
