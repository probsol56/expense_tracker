"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    <main className="relative grid min-h-screen place-items-center bg-sand bg-mesh dark:bg-ink-950 px-4 py-12 sm:p-6 overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-coral-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 font-bold text-white shadow-xl shadow-slate-950/20 ring-1 ring-white/20">
            <span className="text-2xl tracking-tight">WALLO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            {mode === "sign-in"
              ? "Access your unified financial ledger and insights."
              : "Start organizing your finances with calmness and clarity."}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 shadow-card backdrop-blur-xl transition-all dark:border-slate-700 dark:bg-ink-800/80 dark:shadow-none">
          {/* Segmented Auth Mode Switch */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/90 p-1 text-xs font-bold dark:bg-ink-900">
            <button
              type="button"
              onClick={() => {
                setMode("sign-in");
                setMessage("");
              }}
              className={`rounded-lg py-2 transition-all ${
                mode === "sign-in"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-ink-950 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("sign-up");
                setMessage("");
              }}
              className={`rounded-lg py-2 transition-all ${
                mode === "sign-up"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-ink-950 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Email address
              </label>
              <div className="relative">
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="h-11 pl-10"
                />
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <div className="relative">
                <Input
                  name="password"
                  type="password"
                  minLength={6}
                  required
                  placeholder="••••••••"
                  className="h-11 pl-10"
                />
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {message && (
              <div className="flex items-start gap-2.5 rounded-xl border border-coral-200/80 bg-coral-50/80 p-3.5 text-xs font-medium text-coral-700 animate-in fade-in dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle size={16} className="shrink-0 text-coral-600 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                className="w-full h-11 justify-center bg-slate-900 text-white shadow-card hover:bg-slate-800 hover:shadow-glow dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  "Authenticating..."
                ) : (
                  <>
                    <span>{mode === "sign-in" ? "Continue to dashboard" : "Create account"}</span>
                    <ArrowRight size={16} className="ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              By continuing, you agree to our Terms of Service & Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}


