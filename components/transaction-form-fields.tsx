"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowDownRight, ArrowUpRight, Landmark, Plus, Trash2 } from "lucide-react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { TransactionTypeToggle } from "@/components/transaction-type-toggle";
import type { CategoryType } from "@/lib/category-options";
import type { Account, Loan, Transaction, TransactionItem } from "@/lib/types";
import { money } from "@/lib/utils";

const FIELD_LABEL = "block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

interface TransactionFormFieldsProps {
  type: CategoryType;
  setType: (type: CategoryType) => void;
  category: string;
  setCategory: (category: string) => void;
  categoryOptions: string[];
  accounts: Account[];
  accountId: string;
  setAccountId: (accountId: string) => void;
  loans: Loan[];
  loanId: string;
  setLoanId: (loanId: string) => void;
  merchant: string;
  setMerchant: (merchant: string) => void;
  merchantOptions: string[];
  description: string;
  setDescription: (description: string) => void;
  descriptionSuggestions: string[];
  items: TransactionItem[];
  setItems: Dispatch<SetStateAction<TransactionItem[]>>;
  showItemDetails: boolean;
  setShowItemDetails: Dispatch<SetStateAction<boolean>>;
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  computedAmount: number;
  currency: string;
  error: string | null;
  transaction?: Transaction;
}

export function TransactionFormFields({
  type,
  setType,
  category,
  setCategory,
  categoryOptions,
  accounts,
  accountId,
  setAccountId,
  loans,
  loanId,
  setLoanId,
  merchant,
  setMerchant,
  merchantOptions,
  description,
  setDescription,
  descriptionSuggestions,
  items,
  setItems,
  showItemDetails,
  setShowItemDetails,
  amount,
  setAmount,
  computedAmount,
  currency,
  error,
  transaction,
}: TransactionFormFieldsProps) {
  const [showMerchantSuggestions, setShowMerchantSuggestions] = useState(false);
  const merchantSuggestions = useMemo(() => {
    const query = merchant.trim().toLowerCase();
    return merchantOptions.filter((opt) => opt.toLowerCase() !== query && (!query || opt.toLowerCase().includes(query)));
  }, [merchant, merchantOptions]);
  const hasItems = items.length > 0;
  const hasItemDetails = showItemDetails || hasItems;
  const shouldUseItemAmount = showItemDetails && items.some((item) => {
    const name = String(item.name ?? "").trim();
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price || 0);
    const totalPrice = Number(item.total_price || 0);
    return Boolean(name) || quantity > 1 || unitPrice > 0 || totalPrice > 0;
  });

  const updateItem = (id: string, patch: Partial<TransactionItem>) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        const quantity = Number(next.quantity || 1);
        const unitPrice = Number(next.unit_price || 0);
        return { ...next, quantity, unit_price: unitPrice, total_price: quantity * unitPrice };
      })
    );
  };

  const addItem = () => {
    setShowItemDetails(true);
    setItems((current) => [
      ...current,
      { id: `item-${Date.now()}-${Math.random()}`, name: "", quantity: 1, unit_price: 0, total_price: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    setShowItemDetails(nextItems.length > 0);
  };

  return (
    <>
      <TransactionTypeToggle type={type} setType={setType} />

      <div className="space-y-1.5">
        <label className={FIELD_LABEL} id="tx-account-label">Account</label>
        {accounts.length ? (
          <>
            <input type="hidden" name="account_id" value={accountId} />
            <Select value={accountId || undefined} onValueChange={setAccountId}>
              <SelectTrigger aria-labelledby="tx-account-label" className="h-11">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-popover">
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <p className="rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            You need an account before you can record transactions. Add one from the Accounts page first.
          </p>
        )}
      </div>

      {type === "expense" && loans.length > 0 && (
        <div className="space-y-1.5">
          <label className={FIELD_LABEL} id="tx-loan-label">Linked loan (optional)</label>
          <input type="hidden" name="loan_id" value={loanId} />
          <Select value={loanId || "none"} onValueChange={(value) => setLoanId(value === "none" ? "" : value)}>
            <SelectTrigger aria-labelledby="tx-loan-label" className="h-11">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-popover">
              <SelectItem value="none">None</SelectItem>
              {loans.map((loan) => (
                <SelectItem key={loan.id} value={loan.id}>{loan.name} — {loan.lender}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400">Tag this expense as paid using loan funds, for your own tracking.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="tx-merchant" className={FIELD_LABEL}>Merchant / Title</label>
        <div className="relative">
          <Input
            id="tx-merchant"
            name="merchant"
            required
            autoComplete="off"
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
            onFocus={() => setShowMerchantSuggestions(true)}
            onBlur={() => setShowMerchantSuggestions(false)}
            placeholder="e.g. Apple Store, Whole Foods, Freelance Client"
            className="h-11"
          />
          {showMerchantSuggestions && merchantSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-ink-800">
              {merchantSuggestions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setMerchant(opt);
                    setShowMerchantSuggestions(false);
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

      <div className="space-y-1.5">
        <label htmlFor="tx-description" className={FIELD_LABEL}>Description</label>
        <div className="relative">
          <Input
            id="tx-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional note or reference"
            className="h-11"
          />
          {descriptionSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-ink-800">
              {descriptionSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDescription(item)}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-left text-xs text-slate-700 last:border-b-0 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/70"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={FIELD_LABEL}>Item or service details</label>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
          >
            <Plus size={12} /> {hasItems ? "Add another" : "Add details"}
          </button>
        </div>

        {hasItemDetails && (
          <>
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              {items.map((item, index) => (
                <div key={item.id || index} className="grid grid-cols-[minmax(0,1.7fr)_80px_110px_100px_26px] gap-2">
                  <Input
                    value={item.name}
                    onChange={(event) => updateItem(item.id || `${index}`, { name: event.target.value })}
                    placeholder="Item or service"
                    className="h-10 text-sm"
                  />
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity || 1}
                    onChange={(event) => updateItem(item.id || `${index}`, { quantity: Number(event.target.value || 1) })}
                    placeholder="Qty (opt)"
                    className="h-10 text-sm"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price || 0}
                    onChange={(event) => updateItem(item.id || `${index}`, { unit_price: Number(event.target.value || 0) })}
                    placeholder="Amount (opt)"
                    className="h-10 text-sm"
                  />
                  <div className="flex items-center justify-end rounded-xl border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {money(Number(item.total_price || 0), currency)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id || `${index}`)}
                    className="grid place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:text-rose-500 dark:border-slate-700 dark:bg-slate-800"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm dark:border-teal-500/30 dark:bg-teal-500/10">
              <span className="font-medium text-slate-600 dark:text-slate-300">Total</span>
              <span className="text-base font-bold text-teal-700 dark:text-teal-300">{money(computedAmount, currency)}</span>
            </div>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tx-date" className={FIELD_LABEL}>Date</label>
        <Input id="tx-date" name="date" type="date" required defaultValue={transaction?.date || new Date().toISOString().slice(0, 10)} className="h-11" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tx-amount" className={FIELD_LABEL}>Amount</label>
        <div className="relative">
          <Input
            id="tx-amount"
            name="amount"
            required={!shouldUseItemAmount}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            readOnly={shouldUseItemAmount}
            value={shouldUseItemAmount ? computedAmount.toString() : amount || (transaction ? Math.abs(Number(transaction.amount)).toString() : "")}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            aria-invalid={Boolean(error) || undefined}
            className="h-11 pl-4 pr-12 text-base font-bold disabled:cursor-default disabled:opacity-100"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            {type === "income" ? "IN" : type === "loan" ? "LOAN" : "OUT"}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={FIELD_LABEL} id="tx-category-label">Category</label>
        <input type="hidden" name="category" value={category} />
        <Select value={category || undefined} onValueChange={setCategory}>
          <SelectTrigger aria-labelledby="tx-category-label" className="h-11">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-popover">
            {categoryOptions.length ? (
              categoryOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)
            ) : (
              <div className="px-2 py-2 text-xs text-slate-500">No categories available.</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-coral-100 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}
    </>
  );
}
