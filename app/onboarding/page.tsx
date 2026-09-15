import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Sparkles, User, Globe2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace } from "@/app/onboarding/actions";
import { Button, Card, Input } from "@/components/ui";

// Requires an authenticated session — never let it be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login" as any);

  return (
    <main className="relative grid min-h-screen place-items-center bg-sand bg-mesh dark:bg-ink-950 px-4 py-12 sm:p-6 overflow-hidden">
      {/* Decorative ambient background */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 shadow-sm dark:border-teal-800 dark:bg-teal-900/40 dark:text-teal-300 dark:shadow-none">
            <Sparkles size={13} className="text-teal-600 dark:text-teal-400 animate-pulse-subtle" />
            <span>Workspace Setup</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Create your primary workspace
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Workspaces organize transactions, multi-currency accounts, and bank connections.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 sm:p-8 shadow-card backdrop-blur-xl dark:border-slate-700 dark:bg-ink-800/80 dark:shadow-none">
          <form action={createWorkspace} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Workspace Name
              </label>
              <Input
                name="name"
                required
                placeholder="e.g. Personal Wealth, Family Vault, Consulting"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Workspace Type
              </label>
              <select
                name="workspace_type"
                className="h-11 w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 cursor-pointer dark:border-slate-700 dark:bg-ink-800/70 dark:text-slate-100 dark:shadow-none"
              >
                <option value="personal">Personal Finances</option>
                <option value="household">Household & Family</option>
                <option value="business">Business / Freelance</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Primary Base Currency
              </label>
              <select
                name="base_currency"
                defaultValue="BDT"
                className="h-11 w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 cursor-pointer dark:border-slate-700 dark:bg-ink-800/70 dark:text-slate-100 dark:shadow-none"
              >
                <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CAD">CAD ($ - Canadian Dollar)</option>
              </select>
            </div>

            <div className="pt-3">
              <Button
                className="w-full h-11 justify-center bg-slate-900 text-white shadow-card hover:bg-slate-800 hover:shadow-glow dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                type="submit"
              >
                <span>Launch Workspace</span>
                <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}


