import Link from "next/link";
import { Pencil } from "lucide-react";
import { UrlPaginationBar } from "@/components/url-pagination-bar";
import { Card } from "@/components/ui";
import { formatSpendingMonth } from "@/lib/dashboard-month";
import { pageInfo, type Page } from "@/lib/pagination";
import type { AccountIncomeEntry } from "@/lib/account-history";
import type { Account } from "@/lib/types";
import { formatEntryDate, money } from "@/lib/utils";

const tableHeadClass = "px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-widest text-fg-muted";

export function AccountIncomeHistory({
  accounts,
  currency,
  entries,
  month,
}: {
  accounts: Account[];
  currency: string;
  entries: Page<AccountIncomeEntry>;
  month: string;
}) {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));

  return (
    <section className="mb-10 min-w-0">
      <div className="mb-3">
        <h2 className="font-display text-2xl font-medium text-fg">Add money history</h2>
        <p className="mt-1 text-sm text-fg-muted">{formatSpendingMonth(month)}</p>
      </div>
      {entries.totalCount ? (
        <Card className="overflow-hidden">
          <table className="w-full table-fixed border-collapse text-left sm:table-auto">
            <caption className="sr-only">Income recorded into accounts during {formatSpendingMonth(month)}</caption>
            <thead className="border-b-2 border-fg/70">
              <tr>
                <th scope="col" className={`${tableHeadClass} hidden w-32 sm:table-cell`}>Date</th>
                <th scope="col" className={tableHeadClass}>Income source</th>
                <th scope="col" className={`${tableHeadClass} hidden sm:table-cell`}>Account</th>
                <th scope="col" className={`${tableHeadClass} w-32 border-l border-brass/40 text-right sm:w-40`}>Amount</th>
                <th scope="col" className="w-14"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {entries.rows.map((entry) => {
                const account = accountsById.get(entry.account_id);
                const entryDate = formatEntryDate(entry.date);
                return (
                  <tr key={entry.id} className="border-b border-rule last:border-b-0">
                    <td className="hidden px-4 py-3 align-top text-sm tabular-nums text-fg-muted sm:table-cell">
                      <time dateTime={entry.date}>{entryDate}</time>
                    </td>
                    <td className="break-words px-4 py-3 align-top">
                      <p className="font-medium text-fg">{entry.merchant_name ?? "Income"}</p>
                      <p className="text-sm text-fg-muted">
                        <span className="sm:hidden">{entryDate}</span>
                        <span className="sm:hidden"> · {account?.name ?? "Account unavailable"}</span>
                        {entry.category_name && <> · {entry.category_name}</>}
                        {entry.notes && <> · {entry.notes}</>}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 align-top text-sm text-fg-muted sm:table-cell">
                      {account?.name ?? "Account unavailable"}
                    </td>
                    <td className="border-l border-brass/40 px-4 py-3 text-right align-top font-medium tabular-nums text-fg">
                      {money(entry.amount, currency)}
                    </td>
                    <td className="py-1.5 pr-2 align-top">
                      <div className="flex justify-end">
                        <Link
                          href={`/accounts?editIncome=${entry.id}&month=${month}`}
                          aria-label={`Edit income from ${entry.merchant_name ?? "Income"} on ${entryDate}`}
                          className="grid h-11 w-11 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-rule/50 hover:text-fg"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-rule px-4 pb-4">
            <UrlPaginationBar pagination={pageInfo(entries)} pageParam="incomePage" />
          </div>
        </Card>
      ) : (
        <Card className="px-6 py-10 text-center">
          <p className="font-medium text-fg">No add money entries in {formatSpendingMonth(month)}</p>
          <p className="mt-1 text-sm text-fg-muted">Income deposited into an account will appear here.</p>
        </Card>
      )}
    </section>
  );
}
