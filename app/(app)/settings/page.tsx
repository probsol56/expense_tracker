import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const { user, workspace, profile } = await getCurrentWorkspaceAndProfile();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/70 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:border-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
            Account Management
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Settings & Preferences
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure your personal profile details and workspace default currency.
          </p>
        </div>

        <Card className="overflow-hidden shadow-card">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-ink-900/60 p-6">
            <CardTitle className="text-lg sm:text-xl">Workspace Preferences</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Changes will immediately reflect across your financial calculations and dashboards.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 p-6 sm:p-7">
            <div className="flex justify-end gap-2">
              <Link
                href="/categories"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-ink-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-slate-100"
              >
                Manage categories
              </Link>
              <Link
                href="/merchants"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-ink-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-slate-100"
              >
                Manage merchants
              </Link>
            </div>
            <SettingsForm
              initialProfileName={profile?.full_name ?? ""}
              initialWorkspaceName={workspace?.name ?? ""}
              initialBaseCurrency={workspace?.base_currency ?? "BDT"}
            />
          </CardContent>
        </Card>
    </div>
  );
}



