import { redirect } from "next/navigation";
import { Landmark, Plus } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { money } from "@/lib/utils";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { createAccount } from "@/app/(app)/accounts/actions";
import type { Account } from "@/lib/types";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !supabase) {
    return <AccountsContent accounts={[]} currency="BDT" workspaceName="Personal Workspace" error={error} />;
  }

  const { data } = await supabase
    .from("accounts")
    .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
    .order("created_at", { ascending: false });

  const accounts = (data ?? []) as Account[];
  return (
    <AccountsContent
      accounts={accounts}
      currency={workspace?.base_currency || "BDT"}
      workspaceName={workspace?.name || "Personal Workspace"}
      error={error}
    />
  );
}

async function handleCreateAccount(formData: FormData) {
  "use server";
  const result = await createAccount(formData);
  if (result?.error) {
    redirect(`/accounts?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/accounts");
}

function AccountsContent({
  accounts,
  currency,
  workspaceName,
  error,
}: {
  accounts: Account[];
  currency: string;
  workspaceName: string;
  error?: string;
}) {
  return (
    <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/70 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:border-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                {workspaceName}
              </span>
              <span className="text-xs text-slate-400">· {accounts.length} linked accounts</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Financial Accounts
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Connected bank, credit card, and digital depository accounts. Balances update
              automatically from the transactions, loans, and repayments you record against them.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200/70 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        )}

        <Card className="mb-8 shadow-card">
          <div className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-ink-900/60">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add an account</h2>
          </div>
          <div className="p-5">
            <form action={handleCreateAccount} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account name</label>
                <Input name="name" required className="h-11" placeholder="e.g. Main Checking, Cash Wallet" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</label>
                <select name="account_type" defaultValue="checking" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit card</option>
                  <option value="cash">Cash</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Institution</label>
                <Input name="institution" className="h-11" placeholder="Optional, e.g. City Bank" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Starting balance</label>
                <Input name="starting_balance" type="number" step="0.01" defaultValue="0" className="h-11" placeholder="0.00" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full justify-center bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:w-auto">
                  <Plus size={15} className="mr-2 inline" /> Add account
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card transition-all duration-200 hover:border-teal-300 hover:shadow-hover hover:-translate-y-0.5 dark:border-slate-700 dark:bg-ink-800/70 dark:shadow-none dark:hover:border-teal-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-slate-100 dark:text-slate-900">
                    <Landmark size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                      {account.name}
                    </p>
                    <p className="truncate text-xs text-slate-400 capitalize">
                      {account.account_type || "Deposit"} · {account.institution || "Bank Account"}
                    </p>
                  </div>
                </div>
                <Badge variant="teal" size="sm">
                  Active
                </Badge>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Available balance
                </span>
                <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  {money(Number(account.balance), currency)}
                </p>
              </div>
            </div>
          ))}

          {!accounts.length && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white/60 p-12 text-center dark:border-slate-700 dark:bg-ink-800/50">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-ink-800">
                <Landmark size={22} />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No bank accounts linked yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Import transactions or link an institution to see live account balances.
              </p>
            </div>
          )}
        </div>
    </div>
  );
}


