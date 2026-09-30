"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import { AUTH_ROUTES, authCallbackUrl } from "@/lib/auth-routes";
import { AuthCard, AuthMessage, authLinkClass } from "@/components/auth-card";

// Matches Supabase's default per-email limit on confirmation emails.
const RESEND_COOLDOWN_SECONDS = 60;

type ResendStatus = { tone: "error" | "success"; text: string };

type SignUpConfirmationProps = {
  email: string;
  onUseDifferentEmail: () => void;
  onBackToSignIn: () => void;
};

export function SignUpConfirmation({ email, onUseDifferentEmail, onBackToSignIn }: SignUpConfirmationProps) {
  // Sign-up just sent the first email, so the cooldown starts immediately.
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<ResendStatus | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function resend() {
    setResending(true);
    setResendStatus(null);
    const { error } = await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authCallbackUrl(config.siteUrl, AUTH_ROUTES.onboarding) },
    });
    setResending(false);
    if (error) return setResendStatus({ tone: "error", text: error.message });
    setResendStatus({ tone: "success", text: "A new confirmation link is on its way." });
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
  }

  const canResend = secondsLeft <= 0 && !resending;

  return (
    <AuthCard title="Check your inbox" subtitle="One more step to open your ledger.">
      <div className="space-y-4">
        <AuthMessage tone="success">
          We sent a confirmation link to {email}. Open it in this browser to finish creating your account.
        </AuthMessage>

        <p className="text-xs text-ledger-muted dark:text-ledger-muted-dark">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <button
            type="button"
            onClick={resend}
            disabled={!canResend}
            className={`${authLinkClass} disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50`}
          >
            {resending ? "sending…" : secondsLeft > 0 ? `resend in ${secondsLeft}s` : "resend the link"}
          </button>
          .
        </p>

        {resendStatus && <AuthMessage tone={resendStatus.tone}>{resendStatus.text}</AuthMessage>}
      </div>

      <div className="mt-6 flex items-center justify-between text-xs">
        <button type="button" onClick={onUseDifferentEmail} className={authLinkClass}>
          Use a different email
        </button>
        <button type="button" onClick={onBackToSignIn} className={authLinkClass}>
          Back to sign in
        </button>
      </div>
    </AuthCard>
  );
}
