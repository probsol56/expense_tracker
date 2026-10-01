"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui";
import { LEDGER_COLUMN_COUNT, LedgerTable, LedgerTotalsRows, sumLedger } from "@/components/ledger-table";
import type { TransactionTotals } from "@/lib/transactions";
import { TransactionListItem } from "@/components/transaction-list-item";
import { formatEntryDate, money } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export type GroupByMode = "none" | "category" | "date";

interface TransactionsGridProps {
  transactions: Transaction[];
  currency: string;
  groupBy?: GroupByMode;
  isFiltered: boolean;
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
  onClearFilters: () => void;
  rangeTotals?: TransactionTotals;
  rangeTotalsLabel?: string;
}

function getGroupKey(t: Transaction, mode: GroupByMode): string {
  if (mode === "category") return t.category || "Uncategorized";
  if (mode === "date") {
    return formatEntryDate(t.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  return "";
}

function buildGroups(transactions: Transaction[], mode: GroupByMode) {
  const order: string[] = [];
  const map = new Map<string, Transaction[]>();

  for (const t of transactions) {
    const key = getGroupKey(t, mode);
    const group = map.get(key);
    if (group) {
      group.push(t);
    } else {
      order.push(key);
      map.set(key, [t]);
    }
  }

  return order.map((key) => ({ key, items: map.get(key) ?? [] }));
}

function GroupSection({
  groupKey,
  items,
  currency,
  onEdit,
}: {
  groupKey: string;
  items: Transaction[];
  currency: string;
  onEdit: (t: Transaction) => void;
}) {
  const [open, setOpen] = useState(true);
  const { net } = sumLedger(items);

  return (
    <tbody>
      <tr className="border-b border-rule bg-canvas/60">
        <th scope="rowgroup" colSpan={LEDGER_COLUMN_COUNT} className="p-0 text-left font-normal">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-150 hover:bg-rule/40"
          >
            <ChevronDown
              size={15}
              aria-hidden="true"
              className={`shrink-0 text-fg-muted transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
            />
            <span className="min-w-0 flex-1 break-words font-display text-base font-medium text-fg">{groupKey}</span>
            <span className="hidden text-sm text-fg-muted sm:inline">
              {items.length} {items.length === 1 ? "entry" : "entries"}
            </span>
            <span className={`shrink-0 text-sm font-semibold tabular-nums ${net < 0 ? "text-fg" : "text-moss"}`}>
              {net < 0 ? "−" : "+"}
              {money(Math.abs(net), currency)}
            </span>
          </button>
        </th>
      </tr>
      {open &&
        items.map((t) => <TransactionListItem key={t.id} transaction={t} currency={currency} onEdit={onEdit} />)}
    </tbody>
  );
}

export function TransactionsGrid({
  transactions,
  currency,
  groupBy = "none",
  isFiltered,
  onEdit,
  onAdd,
  onClearFilters,
  rangeTotals,
  rangeTotalsLabel = "All pages total",
}: TransactionsGridProps) {
  if (!transactions.length) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="font-display text-xl font-medium text-fg">
          {isFiltered ? "No entries match these filters" : "The ledger is blank"}
        </p>
        <p className="mx-auto mt-2 max-w-prose text-sm text-fg-muted">
          {isFiltered
            ? "Other entries exist. Change or clear the filters to see them."
            : "Record an expense or income, or import a bank statement to fill it in."}
        </p>
        {isFiltered ? (
          <Button variant="link" onClick={onClearFilters} className="mt-3 underline">
            Clear filters
          </Button>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-4">
            <Button variant="primary" onClick={onAdd}>
              Add transaction
            </Button>
            <Link href="/import" className="text-sm font-semibold text-brass-strong underline underline-offset-4 hover:text-fg">
              Import a statement
            </Link>
          </div>
        )}
      </div>
    );
  }

  const pageSum = sumLedger(transactions);
  const totals = (
    <LedgerTotalsRows
      currency={currency}
      totals={[
        { label: "Page total", moneyOut: pageSum.moneyOut, moneyIn: pageSum.moneyIn },
        ...(rangeTotals ? [{ label: rangeTotalsLabel, ...rangeTotals }] : []),
      ]}
    />
  );

  if (groupBy === "none") {
    return (
      <LedgerTable caption="Transactions">
        <tbody>
          {transactions.map((t) => (
            <TransactionListItem key={t.id} transaction={t} currency={currency} onEdit={onEdit} />
          ))}
        </tbody>
        {totals}
      </LedgerTable>
    );
  }

  return (
    <LedgerTable caption={`Transactions grouped by ${groupBy}`}>
      {buildGroups(transactions, groupBy).map((g) => (
        <GroupSection key={g.key} groupKey={g.key} items={g.items} currency={currency} onEdit={onEdit} />
      ))}
      {totals}
    </LedgerTable>
  );
}
