"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { SubmitButton } from "@/components/ui";
import { AuthField, AuthMessage, authButtonClass } from "@/components/auth-card";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations";
import { updatePassword } from "./actions";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, null);

  return (
    <form action={formAction} className="space-y-4">
      <AuthField
        label="New password"
        icon={Lock}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        required
        placeholder="••••••••"
      />
      <AuthField
        label="Confirm new password"
        icon={Lock}
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        required
        placeholder="••••••••"
      />

      {state && <AuthMessage tone="error">{state.error}</AuthMessage>}

      <div className="pt-2">
        <SubmitButton className={authButtonClass} loadingText="Saving password…">
          Set new password
        </SubmitButton>
      </div>
    </form>
  );
}
