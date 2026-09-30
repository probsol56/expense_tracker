"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import { AUTH_ROUTES, authCallbackUrl } from "@/lib/auth-routes";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations";
import { Button } from "@/components/ui";
import { AuthCard, AuthField, AuthMessage, authButtonClass, authLinkClass } from "@/components/auth-card";
import { SignUpConfirmation } from "./sign-up-confirmation";

type Mode = "sign-in" | "sign-up";
type Notice = { tone: "error" | "success"; text: string };

const LINK_ERROR_NOTICE: Notice = {
  tone: "error",
  text: "That link is invalid or has expired. Open it in the same browser you requested it from, or request a new one.",
};

export function LoginForm({ linkError }: { linkError: boolean }) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [notice, setNotice] = useState<Notice | null>(linkError ? LINK_ERROR_NOTICE : null);
  const [loading, setLoading] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setNotice(null);
    setConfirmationSentTo(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const supabase = createClient();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setNotice({ tone: "error", text: error.message });
      window.location.href = AUTH_ROUTES.home;
      return;
    }

    const { data: signUp, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authCallbackUrl(config.siteUrl, AUTH_ROUTES.onboarding) },
    });
    setLoading(false);
    if (error) return setNotice({ tone: "error", text: error.message });
    // With email confirmation on, sign-up returns no session until the link is clicked.
    if (!signUp.session) return setConfirmationSentTo(email);
    window.location.href = AUTH_ROUTES.onboarding;
  }

  if (confirmationSentTo) {
    return (
      <SignUpConfirmation
        email={confirmationSentTo}
        onUseDifferentEmail={() => switchMode("sign-up")}
        onBackToSignIn={() => switchMode("sign-in")}
      />
    );
  }

  return (
    <AuthCard
      title={mode === "sign-in" ? "Welcome back" : "Open a ledger"}
      subtitle={mode === "sign-in" ? "Sign in to pick up where you left off." : "Create an account to start recording."}
    >
      <div
        role="tablist"
        aria-label="Sign in or sign up"
        className="mb-6 flex gap-6 border-b border-ledger-rule dark:border-ledger-rule-dark"
      >
        {(["sign-in", "sign-up"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mode === tab}
            onClick={() => switchMode(tab)}
            className={`-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors focus-visible:outline-ledger-brass dark:focus-visible:outline-ledger-brass-dark ${
              mode === tab
                ? "border-ledger-brass text-ledger-ink dark:border-ledger-brass-dark dark:text-ledger-ink-dark"
                : "border-transparent text-ledger-muted hover:text-ledger-ink dark:text-ledger-muted-dark dark:hover:text-ledger-ink-dark"
            }`}
          >
            {tab === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <AuthField
          label="Email address"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="name@example.com"
        />
        <AuthField
          label="Password"
          icon={Lock}
          name="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          // Existing accounts may predate the current minimum; only new passwords are held to it.
          minLength={mode === "sign-up" ? PASSWORD_MIN_LENGTH : undefined}
          required
          placeholder="••••••••"
        />

        {mode === "sign-in" && (
          <p className="text-right text-xs">
            <Link href={AUTH_ROUTES.forgotPassword} className={authLinkClass}>
              Forgot password?
            </Link>
          </p>
        )}

        {notice && <AuthMessage tone={notice.tone}>{notice.text}</AuthMessage>}

        <div className="pt-2">
          <Button className={authButtonClass} type="submit" disabled={loading}>
            {loading ? (
              mode === "sign-in" ? "Signing in…" : "Creating account…"
            ) : (
              <>
                <span>{mode === "sign-in" ? "Continue to dashboard" : "Create account"}</span>
                <ArrowRight size={16} className="ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </form>

      <p className="mt-6 border-t border-ledger-rule pt-4 text-xs text-ledger-muted dark:border-ledger-rule-dark dark:text-ledger-muted-dark">
        By continuing, you agree to our Terms of Service & Privacy Policy.
      </p>
    </AuthCard>
  );
}
