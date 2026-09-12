import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Landmark, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui";
import { isLoanCategory, isLoanTransaction, money } from "@/lib/utils";
import type { Account, Loan, LoanPayment, Transaction } from "@/lib/types";

export function SummaryCards({
  transactions,
  accounts,
  loans = [],
  loanPayments = [],
  currency = "BDT",
}: {
  transactions: Transaction[];
  accounts: Account[];
  loans?: Loan[];
  loanPayments?: LoanPayment[];
  currency?: string;
}) {
  const outstandingLoanBalance = loans.reduce((total, loan) => total + Number(loan.outstanding_balance), 0);
  const loanPaid = loanPayments.reduce((total, payment) => total + Number(payment.amount), 0);

  // Net worth is assets minus liabilities — cash an account received from a
  // loan is real, but so is the debt it created, so the outstanding balance
  // has to come back out here rather than only showing up on its own card.
  const netWorth = accounts.reduce((total, account) => total + Number(account.balance), 0) - outstandingLoanBalance;

  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const thisMonthTransactions = transactions.filter((t) => t.date.startsWith(currentMonthPrefix));

  const spending = thisMonthTransactions
    .filter((transaction) => Number(transaction.amount) < 0 && !isLoanTransaction(transaction))
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount)), 0);

  // Loan disbursements land as positive-amount transactions so they show up
  // in the account balance, but they're borrowed money, not earned income.
  const income = thisMonthTransactions
    .filter((transaction) => Number(transaction.amount) > 0 && !isLoanCategory(transaction.category))
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const expenseCount = thisMonthTransactions.filter((t) => Number(t.amount) < 0 && !isLoanTransaction(t)).length;
  const loanCount = loans.length;

  return (
    <section className="mb-7 grid gap-4 grid-cols-1 md:grid-cols-4">
      {/* Net Worth Card */}
      <Link href="/accounts" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/70 focus-visible:ring-offset-2 rounded-2xl">
        <div className="relative overflow-hidden rounded-2xl border border-slate-900/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 sm:p-6 text-white shadow-hover">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Net Worth
              </span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-teal-400 backdrop-blur-md">
                <Wallet size={18} />
              </div>
            </div>

            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white truncate">
                {money(netWorth, currency)}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-teal-400 font-medium">
                <Landmark size={13} />
                {accounts.length} {accounts.length === 1 ? "account" : "accounts"} active
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                Live Balance
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Monthly Spending Card */}
      <Link href="/transactions" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-500/70 focus-visible:ring-offset-2 rounded-2xl">
        <Card className="relative overflow-hidden p-5 sm:p-6 shadow-card hover:shadow-hover transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Month&apos;s Spending
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-coral-50 text-coral-600 dark:bg-coral-500/10 dark:text-rose-400">
              <ArrowDownRight size={18} />
            </div>
          </div>

          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {money(-spending, currency)}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{expenseCount} outgoing records</span>
            <span className="inline-flex items-center gap-1 font-semibold text-coral-600 dark:text-rose-400">
              Debits
            </span>
          </div>
        </Card>
      </Link>

      {/* Loan Balance Card */}
      <Link href="/loans" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 rounded-2xl">
        <Card className="relative overflow-hidden p-5 sm:p-6 shadow-card hover:shadow-hover transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Outstanding Loan
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <Landmark size={18} />
            </div>
          </div>

          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {money(outstandingLoanBalance, currency)}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{loanCount} active loan{loanCount === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
              {money(loanPaid, currency)} repaid
            </span>
          </div>
        </Card>
      </Link>

      {/* Monthly Income Card */}
      <Link href="/transactions" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/70 focus-visible:ring-offset-2 rounded-2xl">
        <Card className="relative overflow-hidden p-5 sm:p-6 shadow-card hover:shadow-hover transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Month&apos;s Income
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {money(income, currency)}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recorded inflows</span>
            <span className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400">
              <ArrowUpRight size={14} />
              Credits
            </span>
          </div>
        </Card>
      </Link>
    </section>
  );
}


