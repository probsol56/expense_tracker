import { Card } from "@/components/ui";
import { AccountsMonthFilter } from "@/components/accounts/accounts-month-filter";
import { formatSpendingMonth } from "@/lib/dashboard-month";
import type { AccountMonthlyBalance } from "@/lib/account-history";
import type { Account } from "@/lib/types";
import { money } from "@/lib/utils";

const tableHeadClass = "px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-widest text-fg-muted";

export function AccountMonthlyHistory({
  accounts,
  balances,
  currency,
  month,
  maxMonth,
}: {
  accounts: Account[];
  balances: AccountMonthlyBalance[];
  currency: string;
  month: string;
  maxMonth: string;
}) {
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
  const rows = balances.flatMap((balance) => {
    const accountName = accountNames.get(balance.account_id);
    return accountName ? [{ ...balance, accountName }] : [];
  });

  return (
    <section className="mb-10 min-w-0">
      <div className="mb-3">
        <h2 className="font-display text-2xl font-medium text-fg">Monthly account history</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Opening and closing balances include all account activity; add money shows income recorded during the month.
        </p>
      </div>
      <AccountsMonthFilter month={month} maxMonth={maxMonth} />
      {rows.length ? (
        <Card className="overflow-hidden">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Account balances and income for {formatSpendingMonth(month)}</caption>
            <thead className="border-b-2 border-fg/70">
              <tr>
                <th scope="col" className={tableHeadClass}>Account</th>
                <th scope="col" className={`${tableHeadClass} border-l border-brass/40 text-right`}>Opening</th>
                <th scope="col" className={`${tableHeadClass} border-l border-brass/40 text-right`}>Add money</th>
                <th scope="col" className={`${tableHeadClass} border-l border-brass/40 text-right`}>Closing</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((balance) => (
                <tr key={balance.account_id} className="border-b border-rule last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-fg">
                    {balance.accountName}
                  </th>
                  <td className="border-l border-brass/40 px-4 py-3 text-right tabular-nums text-fg">
                    {money(balance.opening_balance, currency)}
                  </td>
                  <td className="border-l border-brass/40 px-4 py-3 text-right tabular-nums text-fg">
                    {money(balance.income_amount, currency)}
                  </td>
                  <td className="border-l border-brass/40 px-4 py-3 text-right font-medium tabular-nums text-fg">
                    {money(balance.closing_balance, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="px-6 py-10 text-center">
          <p className="font-medium text-fg">{accounts.length ? "No account history available" : "No accounts yet"}</p>
          <p className="mt-1 text-sm text-fg-muted">
            {accounts.length
              ? `There is no account history for ${formatSpendingMonth(month)}.`
              : "Add an account to see its monthly opening and closing balances."}
          </p>
        </Card>
      )}
    </section>
  );
}
