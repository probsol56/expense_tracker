import { redirect } from "next/navigation";
import { EditDialog } from "@/components/edit-dialog";
import { LoanEditForm } from "@/components/loan-edit-form";
import { PICKER_LIMITS } from "@/lib/pagination";
import { parseRecordId } from "@/lib/validations";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import type { Account, Loan } from "@/lib/types";

const LOAN_SELECT =
    "id, workspace_id, user_id, name, lender, principal_amount, outstanding_balance, status, date_started, notes, created_at, transaction_id";

export default async function EditLoanModal({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ error?: string }>;
}) {
    const [{ id }, { error }] = await Promise.all([params, searchParams]);
    const loanId = parseRecordId(id);
    if (!loanId) redirect("/loans");

    const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
    if (!user || !workspace || !supabase) redirect("/loans");

    const [{ data: loanData, error: loanError }, { data: accountData, error: accountError }] = await Promise.all([
        supabase.from("loans").select(LOAN_SELECT).eq("workspace_id", workspace.id).eq("id", loanId).maybeSingle(),
        supabase
            .from("accounts")
            .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
            .eq("workspace_id", workspace.id)
            .order("created_at", { ascending: false })
            .limit(PICKER_LIMITS.accounts),
    ]);
    if (loanError) throw loanError;
    if (accountError) throw accountError;
    if (!loanData) redirect("/loans");

    const loan = loanData as Loan;
    const accounts = (accountData ?? []) as Account[];
    let accountId = "";
    if (loan.transaction_id) {
        const { data: linkedTransaction } = await supabase
            .from("transactions")
            .select("account_id")
            .eq("id", loan.transaction_id)
            .maybeSingle();
        accountId = linkedTransaction?.account_id ?? "";
    }

    return (
        <EditDialog title="Edit loan" closeHref="/loans" closeWithBack error={error}>
            <LoanEditForm
                loan={loan}
                accountId={accountId}
                accounts={accounts}
                currency={workspace.base_currency || "BDT"}
            />
        </EditDialog>
    );
}