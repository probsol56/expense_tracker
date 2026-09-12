import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSearchParam, isLoanCategory } from "@/lib/utils";
import { toTransaction, type TransactionRow } from "@/lib/transactions";
import type { Account, Loan, LoanPayment, Transaction } from "@/lib/types";

export type ActivityType = "all" | "expenses" | "income" | "loan";

const DEFAULT_PAGE_SIZE = 10;

export async function Dashboard({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { user, workspace, profile, supabase } = await getCurrentWorkspaceAndProfile();

  // Pagination / filter params come from the URL and are applied on the server.
  const page = Math.max(1, Number(getSearchParam(searchParams, "page") || 1));
  const pageSize = Math.max(
    1,
    Number(getSearchParam(searchParams, "pageSize") || DEFAULT_PAGE_SIZE),
  );
  const activityType = (getSearchParam(searchParams, "type") || "all") as ActivityType;
  const query = getSearchParam(searchParams, "q");

  if (!user || !supabase || !workspace) {
    return (
      <DashboardShell
        transactions={[]}
        listTransactions={[]}
        accounts={[]}
        workspace={null}
        profile={null}
        pagination={{ page: 1, pageSize, totalPages: 1, totalCount: 0, totalRows: 0 }}
        activityType="all"
        query=""
      />
    );
  }

  // Unlike /transactions (see lib/transactions.ts), this fetches the full
  // transaction set rather than a DB-paginated page: SummaryCards filters
  // this down to the current month itself, and "Recent activity" needs the
  // full history for its own filters/search. Both are paged/filtered in
  // memory since the rows are already in hand.
  const [{ data: transactions }, { data: accounts }, { data: loans }, { data: loanPayments }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, merchant_id, category_id, account_id, merchant:merchants(name), category:categories(name), notes, amount, date, status")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("accounts")
      .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("loans")
      .select("id, workspace_id, user_id, name, lender, principal_amount, outstanding_balance, status, date_started, notes, created_at, transaction_id")
      .eq("workspace_id", workspace.id)
      .order("date_started", { ascending: false }),
    supabase
      .from("loan_payments")
      .select("id, loan_id, workspace_id, user_id, amount, date, notes, created_at, transaction_id")
      .eq("workspace_id", workspace.id)
      .order("date", { ascending: false }),
  ]);

  const dbTransactions = ((transactions ?? []) as TransactionRow[]).map(toTransaction);

  // Loan disbursements/repayments now post real transactions (see
  // app/(app)/loans/actions.ts), which dbTransactions already includes.
  // Only synthesize entries for legacy loans/payments recorded before that
  // linkage existed, so nothing shows up twice.
  const loanActivities: Transaction[] = [
    ...(loans ?? [])
      .filter((loan) => !loan.transaction_id)
      .map((loan) => ({
        id: `loan-${loan.id}`,
        merchant: loan.name,
        notes: loan.lender,
        category: "Loan",
        amount: Number(loan.principal_amount),
        date: loan.date_started,
        status: "cleared" as const,
        loan_id: loan.id,
      })),
    ...(loanPayments ?? [])
      .filter((payment) => !payment.transaction_id)
      .map((payment) => ({
        id: `loan-payment-${payment.id}`,
        merchant: "Loan repayment",
        notes: payment.notes || "Repayment",
        category: "Loan",
        amount: -Number(payment.amount),
        date: payment.date,
        status: "cleared" as const,
        loan_id: payment.loan_id,
      })),
  ];

  // Merge, de-duplicate and sort — all on the server.
  const uniqueById = new Map<string, Transaction>();
  [...dbTransactions, ...loanActivities].forEach((t) => {
    if (!uniqueById.has(t.id)) uniqueById.set(t.id, t);
  });
  const allActivities = [...uniqueById.values()].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  // Server-side type + search filtering.
  const filtered = allActivities.filter((t) => {
    const isLoan = isLoanCategory(t.category);
    const matchesType =
      activityType === "all"
        ? true
        : activityType === "expenses"
          ? Number(t.amount) < 0 && !isLoan
          : activityType === "income"
            ? Number(t.amount) > 0 && !isLoan
            : isLoan;
    if (!matchesType) return false;
    if (query) {
      const haystack = `${t.merchant} ${t.category} ${t.notes ?? ""}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return (
    <DashboardShell
      transactions={dbTransactions}
      listTransactions={pageItems}
      accounts={(accounts ?? []) as Account[]}
      loans={(loans ?? []) as Loan[]}
      loanPayments={(loanPayments ?? []) as LoanPayment[]}
      workspace={workspace}
      profile={profile}
      pagination={{
        page: safePage,
        pageSize,
        totalPages,
        totalCount,
        totalRows: allActivities.length,
      }}
      activityType={activityType}
      query={query}
    />
  );
}
