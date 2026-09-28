"use client";

import { useActionState, useId, useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import { Input, SubmitButton } from "@/components/ui";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/validations";
import { deleteAccount } from "./actions";

export function DeleteAccountForm() {
  const [state, formAction] = useActionState(deleteAccount, null);
  const [confirmation, setConfirmation] = useState("");
  const inputId = useId();
  const confirmed = confirmation === DELETE_ACCOUNT_CONFIRMATION;

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        This permanently deletes your account, your workspace, and every account, transaction, loan, and transfer in
        it. It can&apos;t be undone.
      </p>

      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Type {DELETE_ACCOUNT_CONFIRMATION} to confirm
        </label>
        <Input
          id={inputId}
          name="confirmation"
          autoComplete="off"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="h-11"
        />
      </div>

      {state && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-coral-200/80 bg-coral-50/80 p-4 text-xs font-semibold text-coral-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton
        disabled={!confirmed}
        loadingText="Deleting account…"
        className="w-full sm:w-auto bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
      >
        <Trash2 size={16} className="mr-1.5" />
        Delete my account
      </SubmitButton>
    </form>
  );
}
