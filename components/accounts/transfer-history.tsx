import Link from "next/link";
import { Pencil } from "lucide-react";
import { DeleteTransferButton } from "@/components/delete-transfer-button";
import { UrlPaginationBar } from "@/components/url-pagination-bar";
import { Button, Card, Field, Input } from "@/components/ui";
import { parseSpendingMonth } from "@/lib/dashboard";
import { pageInfo, type Page } from "@/lib/pagination";
import { formatSpendingMonth } from "@/lib/dashboard-month";
import { formatEntryDate, money } from "@/lib/utils";
import type { Account, Transfer } from "@/lib/types";

type FormAction = (formData: FormData) => Promise<void>;

const tableHeadClass = "px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-widest text-fg-muted";

export function TransferHistory({
  accounts,
  currency,
  month,
  transfers,
  deleteAction,
}: {
  accounts: Account[];
  currency: string;
  month: string;
  transfers: Page<Transfer>;
  deleteAction: FormAction;
}) {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));

  return (
    <section className="mb-10 min-w-0">
      <div className="mb-3">
        <h2 className="font-display text-2xl font-medium text-fg">Transfers</h2>
      </div>
      <form action="/accounts" method="get" className="mb-4 flex items-end gap-2">
        <Field label="Month" htmlFor="transfer-month" className="w-full max-w-56">
        <Input
          id="transfer-month"
          name="month"
          type="month"
          min="1900-01"
          max={parseSpendingMonth("", new Date())}
          defaultValue={month}
          required
        />
        </Field>
        <Button type="submit" variant="outline">Show</Button>
      </form>
      {transfers.totalCount ? (
        <Card className="overflow-hidden">
          <table className="w-full table-fixed border-collapse text-left sm:table-auto">
            <caption className="sr-only">Transfer history</caption>
            <thead className="border-b-2 border-fg/70">
              <tr>
                <th scope="col" className={`${tableHeadClass} hidden w-32 sm:table-cell`}>Date</th>
                <th scope="col" className={tableHeadClass}>From → To</th>
                <th scope="col" className={`${tableHeadClass} w-32 border-l border-brass/40 text-right sm:w-40`}>Amount</th>
                <th scope="col" className="w-24"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {transfers.rows.map((transfer) => {
                const fromAccount = transfer.from_account_id ? accountsById.get(transfer.from_account_id) : undefined;
                const toAccount = transfer.to_account_id ? accountsById.get(transfer.to_account_id) : undefined;
                const entryDate = formatEntryDate(transfer.date);
                return (
                  <tr key={transfer.id} className="border-b border-rule last:border-b-0">
                    <td className="hidden px-4 py-3 align-top text-sm tabular-nums text-fg-muted sm:table-cell">
                      <time dateTime={transfer.date}>{entryDate}</time>
                    </td>
                    <td className="break-words px-4 py-3 align-top">
                      <p className="font-medium text-fg">
                        {fromAccount?.name ?? `External: ${transfer.from_account_name ?? "source"}`} → {toAccount?.name ?? `External: ${transfer.to_account_name ?? "recipient"}`}
                      </p>
                      <p className="text-sm text-fg-muted">
                        <span className="sm:hidden">{entryDate}</span>
                        {transfer.notes && <><span className="sm:hidden"> · </span>{transfer.notes}</>}
                      </p>
                    </td>
                    <td className="border-l border-brass/40 px-4 py-3 text-right align-top font-medium tabular-nums text-fg">
                      {money(Number(transfer.amount), currency)}
                    </td>
                    <td className="py-1.5 pr-2 align-top">
                      <div className="flex justify-end">
                        <Link
                          href={`/accounts?editTransfer=${transfer.id}&month=${month}`}
                          aria-label={`Edit transfer on ${entryDate}`}
                          className="grid h-11 w-11 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-rule/50 hover:text-fg"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                        <DeleteTransferButton transferId={transfer.id} month={month} action={deleteAction} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-rule px-4 pb-4">
            <UrlPaginationBar pagination={pageInfo(transfers)} />
          </div>
        </Card>
      ) : (
        <Card className="px-6 py-10 text-center">
          <p className="font-medium text-fg">No transfers in {formatSpendingMonth(month)}</p>
          <p className="mt-1 text-sm text-fg-muted">Choose another month to view its transfer history.</p>
        </Card>
      )}
    </section>
  );
}
