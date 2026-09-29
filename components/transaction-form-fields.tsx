"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Alert, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { TransactionTypeToggle } from "@/components/transaction-type-toggle";
import type { CategoryType } from "@/lib/category-options";
import type { Account, Loan, Transaction, TransactionItem } from "@/lib/types";
import { money } from "@/lib/utils";

const FIELD_LABEL = "block text-sm font-medium text-fg";

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
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const categorySuggestions = useMemo(() => {
    const query = category.trim().toLowerCase();
    return categoryOptions.filter((opt) => opt.toLowerCase() !== query && (!query || opt.toLowerCase().includes(query)));
  }, [category, categoryOptions]);
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
              <SelectTrigger aria-labelledby="tx-account-label">
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
          <p className="rounded-md border border-brass/40 bg-brass/10 px-3 py-2.5 text-sm text-fg">
            You need an account before you can record transactions. Add one from the Accounts page first.
          </p>
        )}
      </div>

      {type === "expense" && loans.length > 0 && (
        <div className="space-y-1.5">
          <label className={FIELD_LABEL} id="tx-loan-label">Linked loan (optional)</label>
          <input type="hidden" name="loan_id" value={loanId} />
          <Select value={loanId || "none"} onValueChange={(value) => setLoanId(value === "none" ? "" : value)}>
            <SelectTrigger aria-labelledby="tx-loan-label">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-popover">
              <SelectItem value="none">None</SelectItem>
              {loans.map((loan) => (
                <SelectItem key={loan.id} value={loan.id}>{loan.name} — {loan.lender}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-fg-muted">Tag this expense as paid using loan funds, for your own tracking.</p>
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
          />
          {showMerchantSuggestions && merchantSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-rule bg-paper shadow-lg">
              {merchantSuggestions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setMerchant(opt);
                    setShowMerchantSuggestions(false);
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

      <div className="space-y-1.5">
        <label htmlFor="tx-description" className={FIELD_LABEL}>Description</label>
        <div className="relative">
          <Input
            id="tx-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional note or reference"
          />
          {descriptionSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-rule bg-paper shadow-lg">
              {descriptionSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDescription(item)}
                  className="block min-h-10 w-full border-b border-rule px-3 py-2 text-left text-sm text-fg last:border-b-0 hover:bg-canvas"
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
          <span className={FIELD_LABEL}>Item or service details</span>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brass-strong underline-offset-4 hover:underline"
          >
            <Plus size={14} aria-hidden="true" /> {hasItems ? "Add another" : "Add details"}
          </button>
        </div>

        {hasItemDetails && (
          <>
            <div className="space-y-3 rounded-md border border-rule bg-canvas p-3">
              {items.map((item, index) => (
                <div key={item.id || index} className="grid grid-cols-[64px_minmax(0,1fr)_minmax(0,1fr)_44px] gap-2 sm:grid-cols-[minmax(0,1.7fr)_64px_96px_96px_44px]">
                  <Input
                    value={item.name}
                    onChange={(event) => updateItem(item.id || `${index}`, { name: event.target.value })}
                    placeholder="Item or service"
                    aria-label={`Item ${index + 1} name`}
                    className="col-span-4 sm:col-span-1"
                  />
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity || 1}
                    onChange={(event) => updateItem(item.id || `${index}`, { quantity: Number(event.target.value || 1) })}
                    placeholder="Qty"
                    aria-label={`Item ${index + 1} quantity`}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price || 0}
                    onChange={(event) => updateItem(item.id || `${index}`, { unit_price: Number(event.target.value || 0) })}
                    placeholder="Price"
                    aria-label={`Item ${index + 1} unit price`}
                  />
                  <div className="flex items-center justify-end px-1 text-sm font-medium tabular-nums text-fg">
                    {money(Number(item.total_price || 0), currency)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id || `${index}`)}
                    className="grid h-11 w-11 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-brick/10 hover:text-brick"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between border-b-[3px] border-double border-fg/50 px-1 py-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Items total</span>
              <span className="font-display text-lg font-medium tabular-nums lining-nums text-fg">{money(computedAmount, currency)}</span>
            </div>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tx-date" className={FIELD_LABEL}>Date</label>
        <Input id="tx-date" name="date" type="date" required defaultValue={transaction?.date || new Date().toISOString().slice(0, 10)} />
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
            className="pl-4 pr-14 font-display text-lg font-medium tabular-nums disabled:cursor-default disabled:opacity-100"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-fg-muted">
            {type === "income" ? "IN" : type === "loan" ? "LOAN" : "OUT"}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tx-category" className={FIELD_LABEL}>Category</label>
        <div className="relative">
          <Input
            id="tx-category"
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

      {error && (
        <Alert>{error}</Alert>
      )}
    </>
  );
}
