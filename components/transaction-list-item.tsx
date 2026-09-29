"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { formatEntryDate, isLoanCategory, isTransferCategory, money } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface TransactionListItemProps {
  transaction: Transaction;
  currency: string;
  onEdit: (transaction: Transaction) => void;
}

const moneyCellClass = "hidden w-36 border-l border-brass/40 px-4 py-3 text-right align-top tabular-nums sm:table-cell";

export function TransactionListItem({
  transaction,
  currency,
  onEdit,
}: TransactionListItemProps) {
  const amount = Number(transaction.amount);
  const isMoneyIn = amount > 0;
  const formattedAmount = money(Math.abs(amount), currency);
  const isLoanEntry = isLoanCategory(transaction.category);
  const isTransferEntry = isTransferCategory(transaction.category);
  const isEditable = !isLoanEntry && !isTransferEntry;
  const entryDate = formatEntryDate(transaction.date, { day: "numeric", month: "short" });

  // Loan and transfer entries are managed on their own pages, so they link there instead of opening the editor.
  const linkedPage = isLoanEntry ? "/loans" : isTransferEntry ? "/accounts" : null;

  return (
    <tr className="group border-b border-rule transition-colors duration-150 last:border-b-0 hover:bg-rule/25">
      <td className="hidden w-20 px-4 py-3 align-top text-sm tabular-nums text-fg-muted sm:table-cell">
        <time dateTime={transaction.date}>{entryDate}</time>
      </td>

      <td className="break-words py-3 pl-4 pr-2 align-top">
        {linkedPage ? (
          <Link href={linkedPage} className="font-medium text-fg underline-offset-4 hover:underline">
            {transaction.merchant}
          </Link>
        ) : (
          <p className="font-medium text-fg">{transaction.merchant}</p>
        )}
        <p className="mt-0.5 text-sm text-fg-muted">
          <span className="sm:hidden">{entryDate} · </span>
          {transaction.category}
          {transaction.notes && <span> · {transaction.notes}</span>}
          {transaction.status === "pending" && (
            <span className="ml-2 inline-block rounded-sm border border-brass/60 px-1.5 text-xs font-semibold uppercase tracking-wider text-brass-strong">
              Pending
            </span>
          )}
        </p>
      </td>

      <td className={`${moneyCellClass} text-fg`}>{isMoneyIn ? null : formattedAmount}</td>
      <td className={`${moneyCellClass} text-moss`}>{isMoneyIn ? formattedAmount : null}</td>

      {/* Below `sm` the two money columns collapse into one signed amount */}
      <td className={`py-3 pl-2 pr-1 text-right align-top font-medium tabular-nums sm:hidden ${isMoneyIn ? "text-moss" : "text-fg"}`}>
        {isMoneyIn ? "+" : "−"}
        {formattedAmount}
      </td>

      <td className="w-12 py-1.5 pr-2 text-right align-top">
        {isEditable && (
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            aria-label={`Edit ${transaction.merchant} on ${entryDate}`}
            className="grid h-11 w-11 place-items-center rounded-lg text-fg-muted transition-[opacity,color] duration-150 hover:bg-rule/40 hover:text-fg focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <Pencil size={15} />
          </button>
        )}
      </td>
    </tr>
  );
}
