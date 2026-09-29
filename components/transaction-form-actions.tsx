"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, SubmitButton } from "@/components/ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    if (!transaction) return;
    setIsDeleting(true);
    const result = await deleteTransaction(transaction.id);
    if (result?.success) {
      onClose();
      return;
    }
    setConfirmOpen(false);
    setError(result?.error || "Failed to delete transaction.");
    setIsDeleting(false);
  };

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
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="border-brick/30 text-brick hover:border-brick/50 hover:bg-brick/10"
          >
            <Trash2 size={15} aria-hidden="true" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
        <ConfirmDialog
          open={confirmOpen}
          title="Delete this transaction?"
          description="This removes the transaction and adjusts the account balance. This can't be undone."
          pending={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
      <SubmitButton
        loadingText={isEditing ? "Updating..." : "Recording..."}
        disabled={!hasAccounts}
        className="w-full sm:w-auto"
      >
        <Plus size={16} aria-hidden="true" />
        {isEditing ? "Update transaction" : "Save transaction"}
      </SubmitButton>
    </div>
  );
}
