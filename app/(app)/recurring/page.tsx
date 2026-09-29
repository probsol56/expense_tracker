import { EditDialog } from "@/components/edit-dialog";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { Alert, Badge, Card, Field, Input, SubmitButton } from "@/components/ui";
import { FigureStrip } from "@/components/figure-strip";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { SignedOutNotice } from "@/components/signed-out-notice";
import { RecurringTransactionForm } from "@/components/recurring-transaction-form";
import {
  createHoliday,
  createRecurringTransaction,
  deleteHoliday,
  deleteRecurringTransaction,
  setRecurringTransactionActive,
  updateRecurringTransaction,
} from "@/app/(app)/recurring/actions";
import { UrlPaginationBar } from "@/components/url-pagination-bar";
import { fetchRecurringSummary } from "@/lib/list-summaries";
import { LIST_PAGE_SIZE, PICKER_LIMITS, fetchPage, pageInfo, parsePage } from "@/lib/pagination";
import { parseRecordId } from "@/lib/validations";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { formatEntryDate, money } from "@/lib/utils";
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

const RECURRING_SELECT =
  "id, workspace_id, user_id, account_id, category_id, merchant_id, type, amount, description, frequency, weekdays, day_of_month, skip_holidays, start_date, end_date, is_active, last_generated_date, created_at, merchant:merchants(name), category:categories(name)";

function toRecurring(row: Record<string, unknown>): RecurringTransaction {
  return {
    ...row,
    merchant: (row.merchant as { name?: string } | null)?.name ?? "",
    category: (row.category as { name?: string } | null)?.name ?? "",
  } as RecurringTransaction;
}

async function handleCreate(formData: FormData) {
  "use server";
  const result = await createRecurringTransaction(formData);
  // Only redirect when the URL needs to change (to surface the error). On
  // success we're already on /recurring — revalidatePath (inside the action)
  // refreshes it in place. Redirecting to the same path here blanks the page
  // during the transition on Next 15 (vercel/next.js#73317).
  if (result?.error) redirect(`/recurring?error=${encodeURIComponent(result.error)}`);
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
}

async function handleToggleActive(formData: FormData) {
  "use server";
  const recurringId = String(formData.get("recurring_id") ?? "");
  const isActive = formData.get("is_active") === "true";
  const result = await setRecurringTransactionActive(recurringId, isActive);
  if (result?.error) redirect(`/recurring?error=${encodeURIComponent(result.error)}`);
}

async function handleCreateHoliday(formData: FormData) {
  "use server";
  const result = await createHoliday(formData);
  if (result?.error) redirect(`/recurring?error=${encodeURIComponent(result.error)}`);
}

async function handleDeleteHoliday(formData: FormData) {
  "use server";
  const holidayId = String(formData.get("holiday_id") ?? "");
  const result = await deleteHoliday(holidayId);
  if (result?.error) redirect(`/recurring?error=${encodeURIComponent(result.error)}`);
}

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string; page?: string; holidayPage?: string }>;
}) {
  const { edit, error, page, holidayPage } = await searchParams;
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();

  if (!user || !supabase || !workspace) {
    return (
      <SignedOutNotice
        title="Sign in to manage recurring transactions"
        description="Create a workspace first, then return here to set up schedules for bills and fixed costs."
      />
    );
  }

  const editingId = parseRecordId(edit);
  const [
    summary,
    { data: accounts, error: accountsError },
    { data: categories, error: categoriesError },
    { data: merchants, error: merchantsError },
    recurring,
    holidays,
    editing,
  ] = await Promise.all([
    fetchRecurringSummary(supabase, workspace.id),
    supabase
      .from("accounts")
      .select("id, name, account_type, balance, starting_balance, institution, last_synced_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(PICKER_LIMITS.accounts),
    supabase.from("categories").select("name, type").eq("workspace_id", workspace.id).order("name").limit(PICKER_LIMITS.categories),
    supabase.from("merchants").select("name").eq("workspace_id", workspace.id).order("name").limit(PICKER_LIMITS.merchants),
    fetchPage<Record<string, unknown>>(
      () =>
        supabase
          .from("recurring_transactions")
          .select(RECURRING_SELECT, { count: "exact" })
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false }),
      parsePage(page ?? ""),
      LIST_PAGE_SIZE,
    ),
    fetchPage<Holiday>(
      () =>
        supabase
          .from("holidays")
          .select("id, workspace_id, date, name", { count: "exact" })
          .eq("workspace_id", workspace.id)
          .order("date", { ascending: true })
          .order("id", { ascending: true }),
      parsePage(holidayPage ?? ""),
      LIST_PAGE_SIZE,
    ),
    editingId
      ? supabase.from("recurring_transactions").select(RECURRING_SELECT).eq("workspace_id", workspace.id).eq("id", editingId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (accountsError) throw accountsError;
  if (categoriesError) throw categoriesError;
  if (merchantsError) throw merchantsError;
  if (editing.error) throw editing.error;

  const accountList = (accounts ?? []) as Account[];
  const recurringList = recurring.rows.map(toRecurring);

  const customCategories: Record<CategoryType, string[]> = { expense: [], income: [], loan: [] };
  for (const c of (categories ?? []) as Array<{ name: string; type: CategoryType }>) {
    customCategories[c.type]?.push(c.name);
  }
  const customMerchants = ((merchants ?? []) as Array<{ name: string }>).map((m) => m.name);

  const editingRecurring = editing.data ? toRecurring(editing.data) : undefined;
  const currency = workspace.base_currency || "BDT";
  const accountNames = new Map(accountList.map((account) => [account.id, account.name]));
  const headClass = "px-4 pb-2 pt-3 text-xs font-semibold uppercase tracking-widest text-fg-muted";
  const moneyCellClass = "hidden w-36 border-l border-brass/40 px-4 py-3 text-right align-top tabular-nums sm:table-cell";
  const iconButtonClass =
    "grid h-11 w-11 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-rule/50 hover:text-fg";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={workspace.name}
        title="Recurring"
        description="Set a schedule once for fares, subscriptions or bills and it posts itself each day it's due, skipping dates you mark as holidays."
      />

      <FigureStrip
        label="Recurring totals"
        figures={[
          { label: "Active schedules", value: summary.active_count },
          { label: "Monthly out, estimated", value: money(summary.monthly_expense, currency) },
          { label: "Monthly in, estimated", value: money(summary.monthly_income, currency), tone: "positive" },
        ]}
      />

      {!accountList.length && (
        <Alert tone="warning" className="mb-6">
          You need an account before you can add a recurring transaction.{" "}
          <Link href="/accounts" className="font-semibold underline underline-offset-2">
            Add an account
          </Link>
          .
        </Alert>
      )}

      {error && !editingRecurring && <Alert className="mb-6">{error}</Alert>}

      {editingRecurring && (
        <EditDialog title="Edit schedule" closeHref="/recurring" error={error} wide>
          <RecurringTransactionForm
            action={handleUpdate}
            accounts={accountList}
            customCategories={customCategories}
            customMerchants={customMerchants}
            currency={currency}
            recurring={editingRecurring}
          />
        </EditDialog>
      )}

      <Section title="Schedules" className="mb-10">
        <Card className="overflow-hidden">
          {recurringList.length ? (
            <table className="w-full table-fixed border-collapse text-left sm:table-auto">
              <caption className="sr-only">Recurring schedules</caption>
              <thead className="border-b-2 border-fg/70">
                <tr>
                  <th scope="col" className={headClass}>Schedule</th>
                  <th scope="col" className={`${headClass} hidden border-l border-brass/40 text-right sm:table-cell`}>Money out</th>
                  <th scope="col" className={`${headClass} hidden border-l border-brass/40 text-right sm:table-cell`}>Money in</th>
                  <th scope="col" className={`${headClass} w-28 text-right sm:hidden`}>Amount</th>
                  <th scope="col" className="w-36"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {recurringList.map((r) => {
                  const isIncome = r.type === "income";
                  const amount = money(r.amount, currency);
                  const accountName = r.account_id ? accountNames.get(r.account_id) : undefined;
                  return (
                    <tr key={r.id} className={`border-b border-rule last:border-b-0 ${r.is_active ? "" : "text-fg-muted"}`}>
                      <td className="break-words px-4 py-3 align-top">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className={`font-medium ${r.is_active ? "text-fg" : ""}`}>{r.merchant}</span>
                          {!r.is_active && <Badge variant="secondary" size="sm">Paused</Badge>}
                        </p>
                        <p className="mt-0.5 text-sm text-fg-muted">
                          {r.category} · {FREQUENCY_LABEL[r.frequency](r)}
                          {r.skip_holidays ? " · skips holidays" : ""}
                          {accountName ? ` · ${accountName}` : ""}
                        </p>
                      </td>
                      <td className={`${moneyCellClass} ${r.is_active ? "text-fg" : ""}`}>{isIncome ? null : amount}</td>
                      <td className={`${moneyCellClass} ${r.is_active ? "text-moss" : ""}`}>{isIncome ? amount : null}</td>
                      <td className={`py-3 pl-2 pr-1 text-right align-top font-medium tabular-nums sm:hidden ${isIncome && r.is_active ? "text-moss" : ""}`}>
                        {isIncome ? "+" : "−"}
                        {amount}
                      </td>
                      <td className="py-1.5 pr-2 align-top">
                        <div className="flex justify-end">
                          <form action={handleToggleActive}>
                            <input type="hidden" name="recurring_id" value={r.id} />
                            <input type="hidden" name="is_active" value={(!r.is_active).toString()} />
                            <button
                              type="submit"
                              aria-label={`${r.is_active ? "Pause" : "Resume"} ${r.merchant}`}
                              title={r.is_active ? "Pause" : "Resume"}
                              className={iconButtonClass}
                            >
                              {r.is_active ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
                            </button>
                          </form>
                          <Link href={`/recurring?edit=${r.id}`} aria-label={`Edit ${r.merchant}`} title="Edit" className={iconButtonClass}>
                            <Pencil size={15} aria-hidden="true" />
                          </Link>
                          <form action={handleDelete}>
                            <input type="hidden" name="recurring_id" value={r.id} />
                            <button
                              type="submit"
                              aria-label={`Delete ${r.merchant}`}
                              title="Delete"
                              className={`${iconButtonClass} hover:bg-brick/10 hover:text-brick`}
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="font-display text-xl font-medium text-fg">No schedules yet</p>
              <p className="mx-auto mt-2 max-w-prose text-sm text-fg-muted">
                Add a schedule below for anything you pay or receive on a regular cycle.
              </p>
            </div>
          )}
          {recurring.totalCount > 0 && (
            <div className="border-t border-rule px-4 pb-4">
              <UrlPaginationBar pagination={pageInfo(recurring)} />
            </div>
          )}
        </Card>
      </Section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-8">
        <Section title="Add a schedule">
          <Card className="p-5">
            <RecurringTransactionForm
              action={handleCreate}
              accounts={accountList}
              customCategories={customCategories}
              customMerchants={customMerchants}
              currency={currency}
            />
          </Card>
        </Section>

        <Section title="Holidays" description="Schedules set to skip holidays won't post on these dates.">
          <Card className="p-5">
            <form action={handleCreateHoliday} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <Field label="Date" htmlFor="holiday-date">
                <Input id="holiday-date" name="date" type="date" required />
              </Field>
              <Field label="Name" htmlFor="holiday-name">
                <Input id="holiday-name" name="name" required placeholder="e.g. Eid" />
              </Field>
              <SubmitButton loadingText="Adding..." variant="outline">
                <Plus size={16} aria-hidden="true" /> Add
              </SubmitButton>
            </form>

            {holidays.rows.length ? (
              <ul className="mt-4 border-t-2 border-fg/70">
                {holidays.rows.map((holiday) => (
                  <li key={holiday.id} className="flex items-center justify-between gap-3 border-b border-rule py-1 pl-1 text-sm last:border-b-0">
                    <span className="min-w-0 break-words text-fg">
                      <time dateTime={holiday.date} className="font-medium tabular-nums">
                        {formatEntryDate(holiday.date)}
                      </time>
                      <span className="text-fg-muted"> · {holiday.name}</span>
                    </span>
                    <form action={handleDeleteHoliday}>
                      <input type="hidden" name="holiday_id" value={holiday.id} />
                      <button
                        type="submit"
                        aria-label={`Remove ${holiday.name}`}
                        className={`${iconButtonClass} hover:bg-brick/10 hover:text-brick`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-fg-muted">No holidays added yet.</p>
            )}
            <UrlPaginationBar pagination={pageInfo(holidays)} pageParam="holidayPage" />
          </Card>
        </Section>
      </div>
    </div>
  );
}
