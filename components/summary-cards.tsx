import Link from "next/link";
import { money } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/dashboard";

const FIGURE_STAGGER_MS = 60;

interface Figure {
  label: string;
  value: string;
  detail: string;
  href: string;
}

function pluralize(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export function SummaryCards({
  summary,
  currency = "BDT",
}: {
  summary: DashboardSummary;
  currency?: string;
}) {
  // Net worth is assets minus liabilities — cash an account received from a
  // loan is real, but so is the debt it created, so the outstanding balance
  // has to come back out here rather than only showing up on its own figure.
  const netWorth = summary.accounts_balance - summary.outstanding_loan_balance;

  const figures: Figure[] = [
    {
      label: "Spent this month",
      value: money(summary.month_spending, currency),
      detail: pluralize(summary.month_expense_count, "expense"),
      href:"/transactions",
    },
    {
      label: "Earned this month",
      value: money(summary.month_income, currency),
      detail: "Income recorded",
      href:"/transactions",
    },
    {
      label: "Loans owed",
      value: money(summary.outstanding_loan_balance, currency),
      detail: `${pluralize(summary.active_loan_count, "active loan")} · ${money(summary.loan_paid, currency)} repaid`,
      href:"/loans",
    },
  ];

  const figureLinkClass =
    "group block rounded-sm animate-settle focus-visible:outline-offset-4";

  return (
    <section
      aria-label="Financial summary"
      // A double rule is the ledger mark for a closing total.
      className="mb-10 grid gap-6 border-b-[3px] border-double border-fg/50 pb-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] lg:gap-8"
    >
      <Link href="/accounts" className={figureLinkClass}>
        <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Net worth</p>
        <p
          className={`mt-2 break-words font-display text-4xl font-medium tabular-nums lining-nums tracking-tight sm:text-5xl ${
            netWorth < 0 ? "text-brick" : "text-fg"
          }`}
        >
          {money(netWorth, currency)}
        </p>
        <p className="mt-2 text-sm text-fg-muted">
          {pluralize(summary.account_count, "account")}, less loans owed
          <span aria-hidden="true" className="ml-1 inline-block transition-transform duration-150 group-hover:translate-x-0.5">→</span>
        </p>
      </Link>

      <div className="grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-rule lg:border-l lg:border-rule">
        {figures.map((figure, index) => (
          <Link
            key={figure.label}
            href={figure.href}
            className={`${figureLinkClass} sm:px-6 sm:first:pl-0 lg:first:pl-6 lg:self-end`}
            style={{ animationDelay: `${(index + 1) * FIGURE_STAGGER_MS}ms` }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">{figure.label}</p>
            <p className="mt-2 break-words font-display text-2xl font-medium tabular-nums lining-nums tracking-tight text-fg">
              {figure.value}
            </p>
            <p className="mt-1 truncate text-sm text-fg-muted group-hover:text-fg">{figure.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
