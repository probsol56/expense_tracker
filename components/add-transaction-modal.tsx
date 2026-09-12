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
        className="fixed inset-0 z-overlay bg-slate-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-transaction-title"
        tabIndex={-1}
        className="relative z-modal w-full max-w-lg rounded-b-none sm:rounded-2xl rounded-t-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xl dark:border-slate-700 dark:bg-ink-900 dark:shadow-none animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />

        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {isEditing ? "Edit Entry" : "New Entry"}
            </span>
            <h2 id="add-transaction-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isEditing ? "Edit transaction" : "Record transaction"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-ink-800 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <AddTransactionForm onClose={onClose} transaction={transaction} currency={currency} accounts={accounts} loans={loans} />
      </div>
    </div>
  );
}
