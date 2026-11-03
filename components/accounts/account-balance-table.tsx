import { Card } from "@/components/ui";
import { AccountBalanceRow } from "@/components/account-balance-row";
import type { Account } from "@/lib/types";
import { money } from "@/lib/utils";

const tableHeadClass = "px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-widest text-fg-muted";

export function AccountBalanceTable({ accounts, currency }: { accounts: Account[]; currency: string }) {
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);

  if (!accounts.length) {
    return (
      <Card className="px-6 py-12 text-center">
        <p className="font-display text-xl font-medium text-fg">No accounts yet</p>
        <p className="mx-auto mt-2 max-w-prose text-sm text-fg-muted">
          Add a bank account, card or cash wallet below to start tracking its balance.
        </p>
      </Card>
    );
  }

  return (
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
              className={`border-l border-brass/40 px-4 py-3 text-right font-display text-xl font-medium tabular-nums lining-nums ${
                totalBalance < 0 ? "text-brick" : "text-fg"
              }`}
            >
              {money(totalBalance, currency)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}
