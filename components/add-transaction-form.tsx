"use client";

import { useEffect, useMemo, useState } from "react";
import { createTransaction, getTransactionForEdit, getWorkspaceSuggestions, searchTransactionNotes, updateTransaction } from "@/app/actions";
import { getCategoryOptions, type CategoryType } from "@/lib/category-options";
import { TransactionFormFields } from "@/components/transaction-form-fields";
import { TransactionFormActions } from "@/components/transaction-form-actions";
import { ReceiptSection, type ScannedReceipt } from "@/components/receipt-section";
import type { Account, Loan, Transaction, TransactionItem } from "@/lib/types";

interface AddTransactionFormProps {
  onClose: () => void;
  transaction?: Transaction;
  currency: string;
  accounts: Account[];
  loans: Loan[];
}

export function AddTransactionForm({ onClose, transaction, currency, accounts, loans }: AddTransactionFormProps) {
  const isEditing = !!transaction;
  const [accountId, setAccountId] = useState<string>(
    () => transaction?.account_id || accounts[0]?.id || "",
  );
  const [loanId, setLoanId] = useState<string>(() => transaction?.loan_id || "");
  const [type, setType] = useState<CategoryType>(() => {
    if (!isEditing) return "expense";
    const amount = Number(transaction.amount);
    if (amount > 0) return "income";
    return "expense";
  });
  const [customCategories, setCustomCategories] = useState<Record<CategoryType, string[]>>({ expense: [], income: [], loan: [] });
  const [customMerchants, setCustomMerchants] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(() => isEditing ? (transaction.category || getCategoryOptions("expense")[0] || "") : getCategoryOptions("expense")[0] ?? "");
  const [merchant, setMerchant] = useState<string>(() => isEditing ? (transaction.merchant || "") : "");
  const [description, setDescription] = useState<string>(() => isEditing ? (transaction.notes || "") : "");
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [amount, setAmount] = useState<string>(() => isEditing ? String(Math.abs(Number(transaction.amount || 0))) : "");
  const [date, setDate] = useState<string>(() => transaction?.date || new Date().toISOString().slice(0, 10));
  const [taxAmount, setTaxAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptWarnings, setReceiptWarnings] = useState<string[]>([]);

  const categoryOptions = useMemo(() => getCategoryOptions(type, customCategories[type]), [type, customCategories]);
  const merchantOptions = useMemo(() => [...new Set([...customMerchants, ...(isEditing && transaction?.merchant ? [transaction.merchant] : [])])].sort((a, b) => a.localeCompare(b)), [customMerchants, isEditing, transaction?.merchant]);
  const itemsSubtotal = useMemo(() => items.reduce((total, item) => total + (Number(item.total_price) || Number(item.quantity || 1) * Number(item.unit_price || 0)), 0), [items]);
  // Mirrors normalizeFormData in app/actions.ts, which recomputes this server-side.
  const computedAmount = Math.round((itemsSubtotal + (Number(taxAmount) || 0) - (Number(discountAmount) || 0)) * 100) / 100;

  function applyScannedReceipt({ path, draft }: ScannedReceipt) {
    setReceiptPath(path);
    if (!draft) return;

    setType("expense");
    if (draft.merchant) setMerchant(draft.merchant);
    if (draft.category) setCategory(draft.category);
    if (draft.date) setDate(draft.date);
    setItems(draft.items.map((item) => ({ ...item, id: `item-${crypto.randomUUID()}` })));
    setShowItemDetails(draft.items.length > 0);
    setTaxAmount(draft.tax_amount?.toString() ?? "");
    setDiscountAmount(draft.discount_amount?.toString() ?? "");
    if (draft.items.length === 0 && draft.amount !== null) setAmount(String(draft.amount));
    setReceiptWarnings(draft.warnings);
  }

  function removeReceipt() {
    setReceiptPath(null);
    setReceiptWarnings([]);
  }

  useEffect(() => {
    if (!transaction?.id) return;

    let active = true;
    async function loadItems(transactionId: string) {
      try {
        const details = await getTransactionForEdit(transactionId);
        if (!active) return;
        const loadedItems = details.items;
        setItems(loadedItems);
        setShowItemDetails(loadedItems.length > 0);
        setTaxAmount(details.tax_amount?.toString() ?? "");
        setDiscountAmount(details.discount_amount?.toString() ?? "");
        setReceiptPath(details.receipt_path);
        if (loadedItems.length === 0) {
          setAmount(String(Math.abs(Number(transaction?.amount || 0))));
        }
      } catch {
        // Saving now would replace the real line items with none, so say so.
        if (active) setError("Couldn't load this transaction's line items. Close and reopen it before saving.");
      }
    }
    void loadItems(transaction.id);

    return () => {
      active = false;
    };
  }, [transaction?.id]);

  useEffect(() => {
    let active = true;
    async function loadSuggestions() {
      try {
        const { categories, merchants } = await getWorkspaceSuggestions();
        if (!active) return;
        setCustomCategories(categories);
        setCustomMerchants(merchants);
      } catch {
        // Suggestions are a convenience; the form works with the built-in categories.
      }
    }
    void loadSuggestions();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (description.trim().length < 2) {
      setDescriptionSuggestions([]);
      return;
    }

    let active = true;
    async function loadDescriptionSuggestions(query: string) {
      try {
        const suggestions = await searchTransactionNotes(query);
        if (active) setDescriptionSuggestions(suggestions);
      } catch {
        // Autocomplete is best-effort; typing must never surface an error.
        if (active) setDescriptionSuggestions([]);
      }
    }
    const timeout = setTimeout(() => void loadDescriptionSuggestions(description), 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [description]);

  return (
    <form className="space-y-4" action={async (fd) => { const r = await (isEditing ? updateTransaction(transaction.id, fd) : createTransaction(fd)); if (r?.success) onClose(); else setError(r?.error || "Failed to save transaction."); }}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="items_json" value={JSON.stringify(items)} />
      <input type="hidden" name="receipt_path" value={receiptPath ?? ""} />
      {(!isEditing || receiptPath) && (
        <ReceiptSection
          receiptPath={receiptPath}
          warnings={receiptWarnings}
          canScan={!isEditing}
          onScanned={applyScannedReceipt}
          onRemove={removeReceipt}
        />
      )}
      <TransactionFormFields
        type={type}
        setType={setType}
        category={category}
        setCategory={setCategory}
        categoryOptions={categoryOptions}
        accounts={accounts}
        accountId={accountId}
        setAccountId={setAccountId}
        loans={loans}
        loanId={loanId}
        setLoanId={setLoanId}
        merchant={merchant}
        setMerchant={setMerchant}
        merchantOptions={merchantOptions}
        description={description}
        setDescription={setDescription}
        descriptionSuggestions={descriptionSuggestions}
        items={items}
        setItems={setItems}
        showItemDetails={showItemDetails}
        setShowItemDetails={setShowItemDetails}
        amount={amount}
        setAmount={setAmount}
        itemsSubtotal={itemsSubtotal}
        computedAmount={computedAmount}
        taxAmount={taxAmount}
        setTaxAmount={setTaxAmount}
        discountAmount={discountAmount}
        setDiscountAmount={setDiscountAmount}
        date={date}
        setDate={setDate}
        currency={currency}
        error={error}
        transaction={transaction}
      />
      <TransactionFormActions onClose={onClose} isEditing={isEditing} isDeleting={isDeleting} setIsDeleting={setIsDeleting} transaction={transaction} setError={setError} hasAccounts={accounts.length > 0} />
    </form>
  );
}
