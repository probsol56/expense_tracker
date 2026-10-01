import type { ReactNode } from "react";
import { money } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

/** Every ledger row spans these columns (some hide below `sm`); full-width rows use it as `colSpan`. */
export const LEDGER_COLUMN_COUNT = 6;

const headerCellClass = "px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-widest text-fg-muted";
const moneyCellClass = "hidden border-l border-brass/40 px-4 py-3 text-right tabular-nums sm:table-cell";

/** Two-column ledger: money out and money in sit in separate brass-ruled columns, collapsing to one signed amount on phones. */
export function LedgerTable({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <table className="w-full table-fixed border-collapse text-left sm:table-auto">
      <caption className="sr-only">{caption}</caption>
      <thead className="border-b-2 border-fg/70">
        <tr>
          <th scope="col" className={`${headerCellClass} hidden sm:table-cell`}>Date</th>
          <th scope="col" className={headerCellClass}>Details</th>
          <th scope="col" className={`${headerCellClass} hidden border-l border-brass/40 text-right sm:table-cell`}>Money out</th>
          <th scope="col" className={`${headerCellClass} hidden border-l border-brass/40 text-right sm:table-cell`}>Money in</th>
          <th scope="col" className={`${headerCellClass} w-28 text-right sm:hidden`}>Amount</th>
          <th scope="col" className="w-12"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      {children}
    </table>
  );
}

export function sumLedger(transactions: Transaction[]) {
  let moneyOut = 0;
  let moneyIn = 0;
  for (const transaction of transactions) {
    const amount = Number(transaction.amount);
    if (amount > 0) moneyIn += amount;
    else moneyOut += Math.abs(amount);
  }
  return { moneyOut, moneyIn, net: moneyIn - moneyOut };
}

export type LedgerTotal = { label: string; moneyOut: number; moneyIn: number };

/** Column totals closed with the accountant's double rule. */
export function LedgerTotalsRows({ totals, currency }: { totals: LedgerTotal[]; currency: string }) {
  return (
    <tfoot className="border-t-2 border-fg/70">
      {totals.map(({ label, moneyOut, moneyIn }, index) => {
        const net = moneyIn - moneyOut;
        const isLast = index === totals.length - 1;
        return (
          <tr
            key={label}
            className={`font-display text-lg font-medium lining-nums ${
              isLast ? "border-b-[3px] border-double border-fg/50" : "border-b border-rule"
            }`}
          >
            <td className="hidden sm:table-cell" />
            <th scope="row" className="py-3 pl-4 pr-2 text-left font-sans text-xs font-semibold uppercase tracking-widest text-fg-muted">
              {label}
            </th>
            <td className={`${moneyCellClass} text-fg`}>{money(moneyOut, currency)}</td>
            <td className={`${moneyCellClass} text-moss`}>{money(moneyIn, currency)}</td>
            <td className={`py-3 pl-2 pr-1 text-right tabular-nums sm:hidden ${net < 0 ? "text-fg" : "text-moss"}`}>
              {net < 0 ? "−" : "+"}
              {money(Math.abs(net), currency)}
            </td>
            <td />
          </tr>
        );
      })}
    </tfoot>
  );
}
