"use client";

import { FormEvent, useId, useState } from "react";
import { Fraunces } from "next/font/google";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

const ledgerDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-ledger-display",
  display: "swap",
});

export default function LoginPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const supabase = createClient();
    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (result.error) {
      setMessage(result.error.message);
    } else {
      window.location.href = mode === "sign-up" ? "/onboarding" : "/";
    }
  }

  return (
    <main
      className={`${ledgerDisplay.variable} grid min-h-screen place-items-center bg-ledger-page dark:bg-ledger-page-dark px-4 py-12 sm:p-6`}
    >
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl shadow-hover">
          {/* Cover — the book's front matter */}
          <div className="bg-ledger-cover px-6 py-8 text-center dark:bg-ledger-cover-dark sm:px-8 sm:py-10">
            <p className="font-ledger text-lg font-semibold tracking-[0.3em] text-ledger-brass dark:text-ledger-brass-dark">
              WALLO
            </p>
            <div className="mx-auto mt-4 h-px w-10 bg-ledger-brass/60 dark:bg-ledger-brass-dark/60" />
            <h1 className="mt-5 font-ledger text-2xl font-semibold text-ledger-cover-text dark:text-ledger-cover-text-dark sm:text-[1.75rem]">
              {mode === "sign-in" ? "Welcome back" : "Open a ledger"}
            </h1>
            <p className="mt-2 text-sm text-ledger-cover-text/70 dark:text-ledger-cover-text-dark/70">
              {mode === "sign-in"
                ? "Sign in to pick up where you left off."
                : "Create an account to start recording."}
            </p>
          </div>

          {/* Page — where the numbers go */}
          <div className="ledger-rules bg-ledger-paper px-6 py-7 dark:bg-ledger-paper-dark sm:px-8 sm:py-8">
            <div className="border-l-2 border-ledger-brass/70 pl-5 dark:border-ledger-brass-dark/60 sm:pl-6">
              {/* Mode switch */}
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
                    onClick={() => {
                      setMode(tab);
                      setMessage("");
                    }}
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
                <div className="space-y-1.5">
                  <label
                    htmlFor={emailId}
                    className="block text-xs font-semibold uppercase tracking-wider text-ledger-muted dark:text-ledger-muted-dark"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Input
                      id={emailId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@example.com"
                      className="h-11 border-ledger-rule bg-ledger-paper pl-10 text-ledger-ink focus-visible:border-ledger-brass focus-visible:ring-ledger-brass/15 dark:border-ledger-rule-dark dark:bg-ledger-paper-dark dark:text-ledger-ink-dark dark:focus-visible:border-ledger-brass-dark"
                    />
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ledger-muted dark:text-ledger-muted-dark"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={passwordId}
                    className="block text-xs font-semibold uppercase tracking-wider text-ledger-muted dark:text-ledger-muted-dark"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id={passwordId}
                      name="password"
                      type="password"
                      autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                      minLength={6}
                      required
                      placeholder="••••••••"
                      className="h-11 border-ledger-rule bg-ledger-paper pl-10 text-ledger-ink focus-visible:border-ledger-brass focus-visible:ring-ledger-brass/15 dark:border-ledger-rule-dark dark:bg-ledger-paper-dark dark:text-ledger-ink-dark dark:focus-visible:border-ledger-brass-dark"
                    />
                    <Lock
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ledger-muted dark:text-ledger-muted-dark"
                    />
                  </div>
                </div>

                {message && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="flex items-start gap-2.5 rounded-lg border border-ledger-brick/25 bg-ledger-brick-bg p-3.5 text-xs font-medium text-ledger-brick dark:border-ledger-brick-dark/30 dark:bg-ledger-brick-bg-dark dark:text-ledger-brick-dark"
                  >
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    className="h-11 w-full justify-center bg-ledger-brass text-ledger-cover shadow-none hover:bg-ledger-brass-deep hover:shadow-none focus-visible:ring-ledger-brass/30 dark:bg-ledger-brass-dark dark:text-ledger-cover-dark dark:hover:bg-ledger-brass-dark-deep dark:focus-visible:ring-ledger-brass-dark/30"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      mode === "sign-in" ? (
                        "Signing in…"
                      ) : (
                        "Creating account…"
                      )
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
