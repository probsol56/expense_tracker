"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui";
import { getCategoryIcon } from "@/lib/category-icon";
import { money } from "@/lib/utils";
import { TransactionRow } from "@/app/(app)/transactions/transaction-row";
import type { Transaction } from "@/lib/types";

export type GroupByMode = "none" | "category" | "date";

interface TransactionsGridProps {
  transactions: Transaction[];
  currency: string;
  groupBy?: GroupByMode;
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
}

// ── helpers ────────────────────────────────────────────────────────────────

function getGroupKey(t: Transaction, mode: GroupByMode): string {
  if (mode === "category") return t.category || "Uncategorized";
  if (mode === "date") {
    // Format: "Fri, Sep 3 2026"
    return new Date(t.date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return "";
}

function buildGroups(transactions: Transaction[], mode: GroupByMode) {
  const order: string[] = [];
  const map = new Map<string, Transaction[]>();

  for (const t of transactions) {
    const key = getGroupKey(t, mode);
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(t);
  }

  return order.map((key) => ({ key, items: map.get(key)! }));
}

// ── sub-components ─────────────────────────────────────────────────────────

function GroupSection({
  groupKey,
  items,
  currency,
  onEdit,
  mode,
}: {
  groupKey: string;
  items: Transaction[];
  currency: string;
  onEdit: (t: Transaction) => void;
  mode: GroupByMode;
}) {
  const [open, setOpen] = useState(true);

  const total = items.reduce((s, t) => s + Number(t.amount), 0);
  const isPositive = total > 0;

  // Icon only for category groups
  const CategoryIcon =
    mode === "category"
      ? getCategoryIcon(groupKey)
      : null;

  return (
    <div>
      {/* ── Group header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 bg-slate-50/80 dark:bg-ink-900/40 px-4 py-2.5 text-left transition-colors hover:bg-slate-100/60 dark:hover:bg-ink-800/40"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {CategoryIcon && (
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 shadow-sm ${CategoryIcon.bg}`}
            >
              <CategoryIcon.icon size={14} />
            </span>
          )}
          <div className="min-w-0">
            <span className="block truncate text-xs font-bold text-slate-700 dark:text-slate-200">
              {groupKey}
            </span>
            <span className="text-[10px] text-slate-400">
              {items.length} transaction{items.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold tabular-nums ${
              isPositive
                ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                : "bg-slate-100 text-slate-700 dark:bg-ink-800 dark:text-slate-300"
            }`}
          >
            {isPositive ? "+" : ""}
            {money(total, currency)}
          </span>
          {open ? (
            <ChevronDown size={13} className="text-slate-400" />
          ) : (
            <ChevronRight size={13} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* ── Rows ── */}
      {open && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              currency={currency}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function TransactionsGrid({
  transactions,
  currency,
  groupBy = "none",
  onEdit,
  onAdd,
}: TransactionsGridProps) {
  if (!transactions.length) {
    return (
      <div className="py-16 px-4 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-ink-800">
          <Receipt size={22} />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          No transactions recorded yet
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Import a bank CSV or add transactions from the dashboard.
        </p>
        <Button
          onClick={onAdd}
          className="mt-5 bg-slate-900 text-white shadow-card hover:bg-slate-800 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Plus size={15} className="mr-1.5 inline" />
          Add transaction
        </Button>
      </div>
    );
  }

  // ── Ungrouped ────────────────────────────────────────────────────────────
  if (groupBy === "none") {
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {transactions.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            currency={currency}
            onEdit={onEdit}
          />
        ))}
      </div>
    );
  }

  // ── Grouped ──────────────────────────────────────────────────────────────
  const groups = buildGroups(transactions, groupBy);
  const grandTotal = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const grandIsPositive = grandTotal > 0;

  return (
    <div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {groups.map((g) => (
          <GroupSection
            key={g.key}
            groupKey={g.key}
            items={g.items}
            currency={currency}
            onEdit={onEdit}
            mode={groupBy}
          />
        ))}
      </div>

      {/* ── Grand total footer ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-ink-900/60 px-5 py-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Total · {transactions.length} transactions
        </span>
        <span
          className={`text-sm font-extrabold tabular-nums ${
            grandIsPositive
              ? "text-teal-600 dark:text-teal-400"
              : "text-slate-900 dark:text-slate-100"
          }`}
        >
          {grandIsPositive ? "+" : ""}
          {money(grandTotal, currency)}
        </span>
      </div>
    </div>
  );
}
