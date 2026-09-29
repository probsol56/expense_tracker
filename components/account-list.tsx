import Link from "next/link";
import { money } from "@/lib/utils";
import type { Account } from "@/lib/types";

export function AccountList({
  accounts,
  totalBalance,
  totalCount,
  currency = "BDT",
}: {
  /** The accounts shown — may be a capped subset of the workspace's accounts. */
  accounts: Account[];
  /** Balance across every account in the workspace, not just the ones shown. */
  totalBalance: number;
  totalCount: number;
  currency?: string;
}) {
  const hiddenCount = totalCount - accounts.length;

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-medium text-fg">Accounts</h2>
        <Link href="/accounts" className="text-sm font-semibold text-brass-strong underline-offset-4 hover:underline">
          Manage
        </Link>
      </div>

      <div className="rounded-lg border border-rule bg-paper px-4">
        {accounts.length ? (
          <>
            <ul>
              {accounts.map((account) => (
                <li key={account.id} className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
                  <div className="min-w-0">
                    <p className="break-words font-medium text-fg">{account.name}</p>
                    <p className="text-sm capitalize text-fg-muted">
                      {account.institution ? `${account.institution} · ` : null}
                      {account.account_type || "deposit"}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-right font-medium tabular-nums ${
                      Number(account.balance) < 0 ? "text-brick" : "text-fg"
                    }`}
                  >
                    {money(Number(account.balance), currency)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline justify-between gap-4 border-b-[3px] border-double border-fg/50 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
                Total{hiddenCount > 0 ? `, all ${totalCount} accounts` : null}
              </p>
              <p className="shrink-0 font-display text-lg font-medium tabular-nums lining-nums text-fg">
                {money(totalBalance, currency)}
              </p>
            </div>

            {hiddenCount > 0 && (
              <Link
                href="/accounts"
                className="flex min-h-11 items-center text-sm font-semibold text-brass-strong underline-offset-4 hover:underline"
              >
                Show {hiddenCount} more {hiddenCount === 1 ? "account" : "accounts"}
              </Link>
            )}
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="font-medium text-fg">No accounts yet</p>
            <p className="mt-1 text-sm text-fg-muted">Add a bank account, card or cash wallet to track its balance.</p>
            <Link
              href="/accounts"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brass-strong underline underline-offset-4 hover:text-fg"
            >
              Add an account
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
