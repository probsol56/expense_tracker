"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { SubmitButton } from "@/components/ui";
import { AuthField, AuthMessage, authButtonClass, authLinkClass } from "@/components/auth-card";
import { AUTH_ROUTES } from "@/lib/auth-routes";
import { requestPasswordReset, type ResetRequestState } from "./actions";

const INITIAL_STATE: ResetRequestState = { status: "idle", message: "" };

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <AuthField
        label="Email address"
        icon={Mail}
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="name@example.com"
      />

      {state.status === "error" && <AuthMessage tone="error">{state.message}</AuthMessage>}
      {state.status === "sent" && <AuthMessage tone="success">{state.message}</AuthMessage>}

      <div className="pt-2">
        <SubmitButton className={authButtonClass} loadingText="Sending link…">
          Send reset link
        </SubmitButton>
      </div>

      <p className="text-center text-xs text-ledger-muted dark:text-ledger-muted-dark">
        Remembered it?{" "}
        <Link href={AUTH_ROUTES.login} className={authLinkClass}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
