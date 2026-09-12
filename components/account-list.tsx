import { ArrowUpRight, CreditCard, Landmark, Plus, Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { money } from "@/lib/utils";
import type { Account } from "@/lib/types";

export function AccountList({
  accounts,
  currency = "BDT",
}: {
  accounts: Account[];
  currency?: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Accounts
          </h2>
          <p className="text-xs text-slate-500">Connected institutions</p>
        </div>
        <Link href="/accounts">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:border-teal-300"
          >
            Manage <ArrowUpRight size={13} className="inline" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-4 shadow-sm transition-all duration-200 hover:border-teal-300 hover:shadow-card hover:-translate-y-0.5 dark:border-slate-700 dark:from-ink-800/80 dark:to-ink-900/60 dark:shadow-none dark:hover:border-teal-700"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-slate-100 dark:text-slate-900">
                  <Landmark size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                    {account.name}
                  </p>
                  <p className="truncate text-xs text-slate-400 capitalize">
                    {account.account_type || "Deposit"}
                  </p>
                </div>
              </div>
              <Badge variant="teal" size="sm" className="shrink-0 capitalize">
                Active
              </Badge>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100/80 dark:border-slate-800 flex items-baseline justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                Available balance
              </span>
              <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {money(Number(account.balance), currency)}
              </p>
            </div>
          </div>
        ))}

        {!accounts.length && (
          <Card className="p-6 text-center shadow-sm">
            <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-ink-800">
              <CreditCard size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No accounts connected yet</p>
            <p className="mt-1 text-[11px] text-slate-400">Link your bank or credit card to track balances.</p>
          </Card>
        )}
      </div>

      {/* Connect Account / Security Badge card */}
      <div className="mt-4 rounded-2xl border border-teal-200/80 bg-gradient-to-br from-mint-50 to-teal-50/50 p-4 shadow-sm dark:border-teal-800/60 dark:from-teal-900/20 dark:to-ink-800/60 dark:shadow-none">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-600 text-white shadow-sm">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-950 dark:text-teal-300">
              Encrypted & Workspace Isolated
            </p>
            <p className="mt-0.5 text-[11px] text-teal-800/80 dark:text-teal-400/80 leading-relaxed">
              Account balances and ledger entries are protected with multi-tenant row-level security.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


