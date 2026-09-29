"use client";

import { useMemo, useState } from "react";
import { Repeat } from "lucide-react";
import { Input, NativeSelect, SubmitButton } from "@/components/ui";
import { TransactionTypeToggle } from "@/components/transaction-type-toggle";
import { getCategoryOptions, type CategoryType } from "@/lib/category-options";
import type { Account, RecurringTransaction } from "@/lib/types";
import { money } from "@/lib/utils";

const FIELD_LABEL = "block text-sm font-medium text-fg";

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
  // The page's create form stays mounted under the edit dialog, so ids are scoped per mode.
  const fieldId = (name: string) => `${isEditing ? "rt-edit" : "rt"}-${name}`;
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
        <label htmlFor={fieldId("merchant")} className={FIELD_LABEL}>Merchant / Title</label>
        <Input
          id={fieldId("merchant")}
          name="merchant"
          required
          list={fieldId("merchant-options")}
          defaultValue={recurring?.merchant ?? ""}
          placeholder="e.g. Bus fare, Internet bill, Claude subscription"
        />
        <datalist id={fieldId("merchant-options")}>
          {merchantOptions.map((opt) => <option key={opt} value={opt} />)}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={fieldId("category")} className={FIELD_LABEL}>Category</label>
        <div className="relative">
          <Input
            id={fieldId("category")}
            name="category"
            required
            autoComplete="off"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            onFocus={() => setShowCategorySuggestions(true)}
            onBlur={() => setShowCategorySuggestions(false)}
            placeholder="e.g. Groceries, Internet bill"
          />
          {showCategorySuggestions && categorySuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-rule bg-paper shadow-lg">
              {categorySuggestions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setCategory(opt);
                    setShowCategorySuggestions(false);
                  }}
                  className="block min-h-10 w-full border-b border-rule px-3 py-2 text-left text-sm text-fg last:border-b-0 hover:bg-canvas"
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
          <label htmlFor={fieldId("amount")} className={FIELD_LABEL}>Amount</label>
          <Input
            id={fieldId("amount")}
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={recurring?.amount}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={fieldId("account")} className={FIELD_LABEL}>Account</label>
          <NativeSelect
            id={fieldId("account")}
            name="account_id"
            required
            disabled={!accounts.length}
            defaultValue={recurring?.account_id ?? ""}
          >
            <option value="">Choose an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} — {money(Number(account.balance), currency)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={fieldId("frequency")} className={FIELD_LABEL}>Repeats</label>
        <NativeSelect
          id={fieldId("frequency")}
          name="frequency"
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as RecurringTransaction["frequency"])}
        >
          <option value="daily">Every day</option>
          <option value="weekly">Specific weekdays</option>
          <option value="monthly">Specific day of month</option>
        </NativeSelect>
      </div>

      {frequency === "weekly" && (
        <fieldset className="space-y-1.5">
          <legend className={`${FIELD_LABEL} mb-1.5`}>On these days</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border px-2.5 text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brass-strong ${
                  weekdays.includes(value)
                    ? "border-fg bg-fg text-paper"
                    : "border-rule bg-paper text-fg-muted hover:border-fg/30 hover:text-fg"
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
            className="min-h-11 text-sm font-semibold text-brass-strong underline-offset-4 hover:underline"
          >
            Set to workdays (all but Friday)
          </button>
        </fieldset>
      )}

      {frequency === "monthly" && (
        <div className="space-y-1.5">
          <label htmlFor={fieldId("day-of-month")} className={FIELD_LABEL}>Day of month</label>
          <Input
            id={fieldId("day-of-month")}
            name="day_of_month"
            type="number"
            min="1"
            max="31"
            required
            defaultValue={recurring?.day_of_month ?? 1}
          />
          <p className="text-sm text-fg-muted">A day past the end of a shorter month (e.g. 31) posts on that month's last day.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={fieldId("start-date")} className={FIELD_LABEL}>Starts</label>
          <Input
            id={fieldId("start-date")}
            name="start_date"
            type="date"
            required
            defaultValue={recurring?.start_date ?? new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={fieldId("end-date")} className={FIELD_LABEL}>Ends (optional)</label>
          <Input
            id={fieldId("end-date")}
            name="end_date"
            type="date"
            defaultValue={recurring?.end_date ?? ""}
          />
        </div>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-fg">
        <input
          type="checkbox"
          name="skip_holidays"
          value="true"
          defaultChecked={recurring?.skip_holidays ?? true}
          className="h-5 w-5 rounded-sm border-rule accent-[rgb(var(--fg))]"
        />
        Skip dates marked as holidays
      </label>

      <div className="space-y-1.5">
        <label htmlFor={fieldId("description")} className={FIELD_LABEL}>Description (optional)</label>
        <Input id={fieldId("description")} name="description" defaultValue={recurring?.description ?? ""} />
      </div>

      <SubmitButton loadingText="Saving schedule..." disabled={!accounts.length} className="w-full">
        <Repeat size={16} aria-hidden="true" /> {isEditing ? "Save schedule" : "Add schedule"}
      </SubmitButton>
    </form>
  );
}
