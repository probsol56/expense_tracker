"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui";
import { deleteTransaction } from "@/app/actions";
import type { Transaction } from "@/lib/types";

interface TransactionFormActionsProps {
  onClose: () => void;
  isEditing: boolean;
  isDeleting: boolean;
  setIsDeleting: (value: boolean) => void;
  transaction?: Transaction;
  setError: (error: string | null) => void;
  hasAccounts: boolean;
}

export function TransactionFormActions({
  onClose,
  isEditing,
  isDeleting,
  setIsDeleting,
  transaction,
  setError,
  hasAccounts,
}: TransactionFormActionsProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-between gap-2.5 pt-4">
      <div className="flex gap-2.5">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="flex-1 sm:flex-auto"
        >
          Cancel
        </Button>
        {isEditing && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Are you sure you want to delete this transaction?")) return;
              setIsDeleting(true);
              const result = await deleteTransaction(transaction!.id);
              if (result?.success) {
                onClose();
              } else {
                setError(result?.error || "Failed to delete transaction.");
                setIsDeleting(false);
              }
            }}
            disabled={isDeleting}
            className="rounded-lg border border-red-200/80 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 shadow-sm transition-all hover:bg-red-100 hover:text-red-700 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            aria-label="Delete transaction"
          >
            <Trash2 size={14} className="inline mr-1.5" />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
      <SubmitButton
        loadingText={isEditing ? "Updating..." : "Recording..."}
        disabled={!hasAccounts}
        className="w-full sm:w-auto bg-slate-900 text-white shadow-card hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:shadow-none"
      >
        <Plus size={16} className="mr-1.5" />
        {isEditing ? "Update transaction" : "Save transaction"}
      </SubmitButton>
    </div>
  );
}
