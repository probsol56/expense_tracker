import Link from "next/link";
import { Building2, CirclePlus } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { createMerchant } from "@/app/(app)/merchants/actions";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !supabase || !workspace) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-slate-900">Sign in to manage merchants</h1>
        <p className="mt-2 text-sm text-slate-500">
          Create a workspace first, then return here to add your merchant names.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Go to login
        </Link>
      </div>
    );
  }

  const { data: merchants } = await supabase
    .from("merchants")
    .select("id, name")
    .eq("workspace_id", workspace.id)
    .order("name", { ascending: true });

  const error = (await searchParams)?.error;

  return (
    <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:border-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
              <Building2 size={12} /> Merchant library
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Saved merchants
            </h1>
          </div>
          <Link href="/settings" className="inline-flex items-center justify-center">
            <Button variant="outline">Back to settings</Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden shadow-card">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-ink-900/60 p-6">
              <CardTitle className="text-lg sm:text-xl">Merchant list</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Merchants are shared across your workspace and reused in transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {merchants && merchants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(merchants ?? []).map((merchant) => (
                    <span
                      key={merchant.id}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {merchant.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500">No merchants added yet.</span>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CirclePlus size={18} className="text-teal-600" /> Add merchant
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Create a reusable merchant name for this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form action={createMerchant} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="merchant-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Merchant name
                  </label>
                  <input
                    id="merchant-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="e.g. Apple Store, Netflix"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-ink-900 dark:text-slate-100 dark:focus:border-teal-500 dark:focus:ring-teal-900/50"
                  />
                </div>

                {error && (
                  <p role="alert" className="flex items-start gap-2 rounded-xl border border-coral-100 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500"
                  >
                    Save merchant
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
