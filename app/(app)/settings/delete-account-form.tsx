"use client";

import { useActionState, useId, useState } from "react";
import { Trash2 } from "lucide-react";
import { Alert, Field, Input, SubmitButton } from "@/components/ui";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/validations";
import { deleteAccount } from "./actions";

export function DeleteAccountForm() {
  const [state, formAction] = useActionState(deleteAccount, null);
  const [confirmation, setConfirmation] = useState("");
  const inputId = useId();
  const confirmed = confirmation === DELETE_ACCOUNT_CONFIRMATION;

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-fg-muted">
        This permanently deletes your account, your workspace, and every account, transaction, loan, and transfer in
        it. It can&apos;t be undone.
      </p>

      <Field label={`Type ${DELETE_ACCOUNT_CONFIRMATION} to confirm`} htmlFor={inputId}>
        <Input
          id={inputId}
          name="confirmation"
          autoComplete="off"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </Field>

      {state && <Alert>{state.error}</Alert>}

      <SubmitButton disabled={!confirmed} variant="destructive" loadingText="Deleting account…" className="w-full sm:w-auto">
        <Trash2 size={16} aria-hidden="true" />
        Delete my account
      </SubmitButton>
    </form>
  );
}
