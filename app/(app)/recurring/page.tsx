import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarOff, Pause, Pencil, Play, Plus, Repeat, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { RecurringTransactionForm } from "@/components/recurring-transaction-form";
import {
  createHoliday,
  createRecurringTransaction,
  deleteHoliday,
  deleteRecurringTransaction,
  setRecurringTransactionActive,
  updateRecurringTransaction,
} from "@/app/(app)/recurring/actions";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { money } from "@/lib/utils";
import type { Account, Holiday, RecurringTransaction } from "@/lib/types";
import type { CategoryType } from "@/lib/category-options";

const FREQUENCY_LABEL: Record<RecurringTransaction["frequency"], (r: RecurringTransaction) => string> = {
  daily: () => "Every day",
  weekly: (r) => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `Weekly · ${(r.weekdays ?? []).map((d) => names[d]).join(", ")}`;
  },
  monthly: (r) => `Monthly · day ${r.day_of_month}`,
};

const OCCURRENCES_PER_MONTH: Record<RecurringTransaction["frequency"], (r: RecurringTransaction) => number> = {
  daily: () => 30,
  weekly: (r) => (r.weekdays?.length ?? 0) * 4.345,
  monthly: () => 1,
};

async function handleCreate(formData: FormData) {
  "use server";
  const result = await createRecurringTransaction(formData);
  if (result?.error) redirect(`/recurring?error=${encodeURIComponent(result.error)}`);
  redirect("/recurring");
}

async function handleUpdate(formData: FormData) {
  "use server";
  const recurringId = String(formData.get("recurring_id") ?? "");
  const result = await updateRecurringTransaction(recurringId, formData);
  if (result?.error) redirect(`/recurring?edit=${recurringId}&error=${encodeURIComponent(result.error)}`);
  redirect("/recurring");
}

async function handleDelete(formData: FormData) {
  "use server";
  const recurringId = String(formData.get("recurring_id") ?? "");
  const result = await deleteRecurringTransaction(recurringId);
  if (result?.error) redirect(`/recurring?error=${encodeURIComponent(result.error)}`);
  redirect("/recurring");
}

async function handleToggleActive(formData: FormData) {
  "use server";
  const recurringId = String(formData.get("recurring_id") ?? "");
  const isActive = formData.get("is_active") === "true";
  const result = await setRecurringTransactionActive(recurringId, isActive);
  if (result?.error) redirect(`/recurring?error=${encodeURIComponent(result.error)}`);
  redirect("/recurring");
}

async function handleCreateHoliday(formData: FormData) {
  "use server";
  const result = await createHoliday(formData);
  if (result?.error) redirect(`/recurring?error=${encodeURIComponent(result.error)}`);
  redirect("/recurring");
}

async function handleDeleteHoliday(formData: FormData) {
  "use server";
  const holidayId = String(formData.get("holiday_id") ?? "");
  const result = await deleteHoliday(holidayId);
  if (result?.error) redirect(`/recurring?error=${encodeURIComponent(result.error)}`);
  redirect("/recurring");
}

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string }>;
}) {
  const { edit: editingId, error } = await searchParams;
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();

  if (!user || !supabase || !workspace) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-slate-900">Sign in to manage recurring transactions</h1>
        <p className="mt-2 text-sm text-slate-500">
          Create a workspace first, then return here to set up schedules for bills and fixed costs.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Go to login
        </Link>
      </div>
    );
  }

  const [{ data: accounts }, { data: categories }, { data: merchants }, { data: recurring }, { data: holidays }] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("name, type").eq("workspace_id", workspace.id),
      supabase.from("merchants").select("name").eq("workspace_id", workspace.id),
      supabase
        .from("recurring_transactions")
        .select(
          "id, workspace_id, user_id, account_id, category_id, merchant_id, type, amount, description, frequency, weekdays, day_of_month, skip_holidays, start_date, end_date, is_active, last_generated_date, created_at, merchant:merchants(name), category:categories(name)"
        )
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false }),
      supabase.from("holidays").select("id, workspace_id, date, name").eq("workspace_id", workspace.id).order("date", { ascending: true }),
    ]);

  const accountList = (accounts ?? []) as Account[];
  const holidayList = (holidays ?? []) as Holiday[];
  const recurringList = ((recurring ?? []) as Array<Record<string, unknown>>).map((row) => ({
    ...row,
    merchant: (row.merchant as { name?: string } | null)?.name ?? "",
    category: (row.category as { name?: string } | null)?.name ?? "",
  })) as RecurringTransaction[];

  const customCategories: Record<CategoryType, string[]> = { expense: [], income: [], loan: [] };
  for (const c of (categories ?? []) as Array<{ name: string; type: CategoryType }>) {
    customCategories[c.type]?.push(c.name);
  }
  const customMerchants = ((merchants ?? []) as Array<{ name: string }>).map((m) => m.name);

  const editingRecurring = editingId ? recurringList.find((r) => r.id === editingId) : undefined;
  const activeCount = recurringList.filter((r) => r.is_active).length;
  const estimatedMonthlyExpense = recurringList
    .filter((r) => r.is_active && r.type === "expense")
    .reduce((sum, r) => sum + r.amount * OCCURRENCES_PER_MONTH[r.frequency](r), 0);
  const estimatedMonthlyIncome = recurringList
    .filter((r) => r.is_active && r.type === "income")
    .reduce((sum, r) => sum + r.amount * OCCURRENCES_PER_MONTH[r.frequency](r), 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300">
            <Repeat size={12} /> Recurring transactions
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Recurring transactions & holidays
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Set a schedule once — commute fares, subscriptions, bills — and it posts itself daily via Supabase, skipping any dates you mark as holidays.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active schedules</span>
            <Repeat size={16} className="text-teal-600" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{activeCount}</div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Est. monthly expense</span>
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-coral-600 dark:text-rose-400">
            {money(estimatedMonthlyExpense, workspace.base_currency || "BDT")}
          </div>
        </Card>
        <Card className="p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Est. monthly income</span>
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            {money(estimatedMonthlyIncome, workspace.base_currency || "BDT")}
          </div>
        </Card>
      </div>

      {!accountList.length && (
        <div className="mt-8 rounded-2xl border border-amber-200/70 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          You need an account before you can add a recurring transaction.{" "}
          <Link href="/accounts" className="font-semibold underline underline-offset-2">Add an account</Link>.
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-2xl border border-rose-200/70 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-ink-900/60">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingRecurring ? "Edit schedule" : "Add a schedule"}
            </h2>
            {editingRecurring && (
              <Link href="/recurring" className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</Link>
            )}
          </div>
          <div className="p-5">
            <RecurringTransactionForm
              action={editingRecurring ? handleUpdate : handleCreate}
              accounts={accountList}
              customCategories={customCategories}
              customMerchants={customMerchants}
              currency={workspace.base_currency || "BDT"}
              recurring={editingRecurring}
            />
          </div>
        </Card>

        <Card className="shadow-card">
          <div className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-ink-900/60">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Holidays</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Dates a schedule with "Skip dates marked as holidays" won't post on.</p>
          </div>
          <div className="p-5">
            <form action={handleCreateHoliday} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="holiday-date" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</label>
                <Input id="holiday-date" name="date" type="date" required className="h-11" />
              </div>
              <div className="flex-1 space-y-1.5">
                <label htmlFor="holiday-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</label>
                <Input id="holiday-name" name="name" required placeholder="e.g. Eid, Independence Day" className="h-11" />
              </div>
              <Button type="submit" className="h-11 shrink-0 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                <Plus size={15} className="mr-1.5 inline" /> Add
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {holidayList.length ? (
                holidayList.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <CalendarOff size={14} className="text-slate-400" />
                      <span className="font-semibold">{new Date(holiday.date).toLocaleDateString()}</span>
                      <span className="text-slate-400">·</span>
                      <span>{holiday.name}</span>
                    </div>
                    <form action={handleDeleteHoliday}>
                      <input type="hidden" name="holiday_id" value={holiday.id} />
                      <button type="submit" aria-label={`Remove ${holiday.name}`} className="text-slate-400 hover:text-rose-500">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No holidays added yet.</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="overflow-hidden shadow-card">
          <div className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-ink-900/60">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Schedules</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recurringList.length ? (
              recurringList.map((r) => (
                <div key={r.id} className="group flex flex-col gap-3 p-5 transition-colors hover:bg-slate-50/60 dark:hover:bg-ink-900/40 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm ${r.is_active ? "bg-slate-900 dark:bg-slate-100 dark:text-slate-900" : "bg-slate-300 dark:bg-slate-700"}`}>
                      <Repeat size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{r.merchant}</h3>
                        <Badge variant={r.type === "income" ? "emerald" : "coral"} size="sm">{r.type === "income" ? "Income" : "Expense"}</Badge>
                        {!r.is_active && <Badge variant="secondary" size="sm">Paused</Badge>}
                        <Link href={`/recurring?edit=${r.id}`} aria-label={`Edit ${r.merchant}`} className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-semibold text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 dark:hover:bg-ink-800 dark:hover:text-slate-200">
                          <Pencil size={12} /> Edit
                        </Link>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {r.category} · {FREQUENCY_LABEL[r.frequency](r)}
                        {r.skip_holidays ? " · skips holidays" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-sm font-bold ${r.type === "income" ? "text-emerald-600" : "text-coral-600 dark:text-rose-400"}`}>
                        {r.type === "income" ? "+" : "-"}{money(r.amount, workspace.base_currency || "BDT")}
                      </div>
                      <div className="text-[11px] text-slate-400">{r.account_id ? accountList.find((a) => a.id === r.account_id)?.name : ""}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <form action={handleToggleActive}>
                        <input type="hidden" name="recurring_id" value={r.id} />
                        <input type="hidden" name="is_active" value={(!r.is_active).toString()} />
                        <button type="submit" aria-label={r.is_active ? "Pause" : "Resume"} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-ink-800 dark:hover:text-slate-200">
                          {r.is_active ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      </form>
                      <form action={handleDelete}>
                        <input type="hidden" name="recurring_id" value={r.id} />
                        <button type="submit" aria-label={`Delete ${r.merchant}`} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400">
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No recurring transactions yet. Add your first schedule above.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
