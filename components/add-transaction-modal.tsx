"use client";

import { useRef, useEffect } from "react";
import { X } from "lucide-react";
import { AddTransactionForm } from "@/components/add-transaction-form";
import type { Account, Loan, Transaction } from "@/lib/types";

interface AddTransactionModalProps {
  onClose: () => void;
  transaction?: Transaction;
  currency?: string;
  accounts: Account[];
  loans?: Loan[];
}

export function AddTransactionModal({ onClose, transaction, currency = "BDT", accounts, loans = [] }: AddTransactionModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const isEditing = !!transaction;

  // §1.3 / §6: Escape closes the dialog; focus is trapped inside and restored on close.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 z-overlay bg-cover/60 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-transaction-title"
        tabIndex={-1}
        className="relative z-modal w-full max-w-lg rounded-b-none sm:rounded-lg rounded-t-lg border border-rule bg-paper p-6 sm:p-7 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-rule sm:hidden" />

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brass-strong">
              {isEditing ? "Edit entry" : "New entry"}
            </span>
            <h2 id="add-transaction-title" className="font-display text-2xl font-medium text-fg">
              {isEditing ? "Edit transaction" : "Record transaction"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            type="button"
            className="-mr-2 grid h-11 w-11 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-rule/50 hover:text-fg"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <AddTransactionForm onClose={onClose} transaction={transaction} currency={currency} accounts={accounts} loans={loans} />
      </div>
    </div>
  );
}
