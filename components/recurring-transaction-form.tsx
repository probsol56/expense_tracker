"use client";

import { useMemo, useState } from "react";
import { Repeat } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { TransactionTypeToggle } from "@/components/transaction-type-toggle";
import { getCategoryOptions, type CategoryType } from "@/lib/category-options";
import type { Account, RecurringTransaction } from "@/lib/types";
import { money } from "@/lib/utils";

const FIELD_LABEL = "block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";
const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];
const WORKDAYS = [0, 1, 2, 3, 4, 6];

interface RecurringTransactionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  accounts: Account[];
  customCategories: Record<CategoryType, string[]>;
  customMerchants: string[];
  currency: string;
  recurring?: RecurringTransaction;
}

export function RecurringTransactionForm({
  action,
  accounts,
  customCategories,
  customMerchants,
  currency,
  recurring,
}: RecurringTransactionFormProps) {
  const isEditing = !!recurring;
  const [type, setType] = useState<CategoryType>(recurring?.type ?? "expense");
  const [frequency, setFrequency] = useState<RecurringTransaction["frequency"]>(recurring?.frequency ?? "weekly");
  const [weekdays, setWeekdays] = useState<number[]>(recurring?.weekdays ?? WORKDAYS);

  const categoryOptions = useMemo(() => getCategoryOptions(type, customCategories[type]), [type, customCategories]);
  const [category, setCategory] = useState(recurring?.category ?? categoryOptions[0] ?? "");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const categorySuggestions = useMemo(() => {
    const query = category.trim().toLowerCase();
    return categoryOptions.filter((opt) => opt.toLowerCase() !== query && (!query || opt.toLowerCase().includes(query)));
  }, [category, categoryOptions]);
  const merchantOptions = [...new Set(customMerchants)].sort((a, b) => a.localeCompare(b));

  const toggleWeekday = (day: number) => {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()
    );
  };

  return (
    <form action={action} className="space-y-4">
      {isEditing && <input type="hidden" name="recurring_id" value={recurring.id} />}

      <TransactionTypeToggle type={type} setType={setType} />
      <input type="hidden" name="type" value={type} />

      <div className="space-y-1.5">
        <label htmlFor="rt-merchant" className={FIELD_LABEL}>Merchant / Title</label>
        <Input
          id="rt-merchant"
          name="merchant"
          required
          list="rt-merchant-options"
          defaultValue={recurring?.merchant ?? ""}
          placeholder="e.g. Bus fare, Internet bill, Claude subscription"
          className="h-11"
        />
        <datalist id="rt-merchant-options">
          {merchantOptions.map((opt) => <option key={opt} value={opt} />)}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="rt-category" className={FIELD_LABEL}>Category</label>
        <div className="relative">
          <Input
            id="rt-category"
            name="category"
            required
            autoComplete="off"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            onFocus={() => setShowCategorySuggestions(true)}
            onBlur={() => setShowCategorySuggestions(false)}
            placeholder="e.g. Groceries, Internet bill"
            className="h-11"
          />
          {showCategorySuggestions && categorySuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-ink-800">
              {categorySuggestions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setCategory(opt);
                    setShowCategorySuggestions(false);
                  }}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs text-slate-700 last:border-b-0 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/70"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="rt-amount" className={FIELD_LABEL}>Amount</label>
          <Input
            id="rt-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={recurring?.amount}
            placeholder="0.00"
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="rt-account" className={FIELD_LABEL}>Account</label>
          <select
            id="rt-account"
            name="account_id"
            required
            disabled={!accounts.length}
            defaultValue={recurring?.account_id ?? ""}
            className={SELECT_CLASS}
          >
            <option value="">Choose an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} — {money(Number(account.balance), currency)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="rt-frequency" className={FIELD_LABEL}>Repeats</label>
        <select
          id="rt-frequency"
          name="frequency"
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as RecurringTransaction["frequency"])}
          className={SELECT_CLASS}
        >
          <option value="daily">Every day</option>
          <option value="weekly">Specific weekdays</option>
          <option value="monthly">Specific day of month</option>
        </select>
      </div>

      {frequency === "weekly" && (
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>On these days</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border px-2.5 text-xs font-bold transition ${
                  weekdays.includes(value)
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-500/60 dark:bg-teal-500/10 dark:text-teal-300"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                <input
                  type="checkbox"
                  name="weekdays"
                  value={value}
                  checked={weekdays.includes(value)}
                  onChange={() => toggleWeekday(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setWeekdays(WORKDAYS)}
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400"
          >
            Set to workdays (Mon–Fri)
          </button>
        </div>
      )}

      {frequency === "monthly" && (
        <div className="space-y-1.5">
          <label htmlFor="rt-day-of-month" className={FIELD_LABEL}>Day of month</label>
          <Input
            id="rt-day-of-month"
            name="day_of_month"
            type="number"
            min="1"
            max="31"
            required
            defaultValue={recurring?.day_of_month ?? 1}
            className="h-11"
          />
          <p className="text-[11px] text-slate-400">A day past the end of a shorter month (e.g. 31) posts on that month's last day.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="rt-start-date" className={FIELD_LABEL}>Starts</label>
          <Input
            id="rt-start-date"
            name="start_date"
            type="date"
            required
            defaultValue={recurring?.start_date ?? new Date().toISOString().slice(0, 10)}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="rt-end-date" className={FIELD_LABEL}>Ends (optional)</label>
          <Input
            id="rt-end-date"
            name="end_date"
            type="date"
            defaultValue={recurring?.end_date ?? ""}
            className="h-11"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          name="skip_holidays"
          value="true"
          defaultChecked={recurring?.skip_holidays ?? true}
          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        Skip dates marked as holidays
      </label>

      <div className="space-y-1.5">
        <label htmlFor="rt-description" className={FIELD_LABEL}>Description (optional)</label>
        <Input id="rt-description" name="description" defaultValue={recurring?.description ?? ""} className="h-11" />
      </div>

      <Button type="submit" disabled={!accounts.length} className="w-full justify-center bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
        <Repeat size={15} className="mr-2 inline" /> {isEditing ? "Save schedule" : "Add schedule"}
      </Button>
    </form>
  );
}
