"use client";

import { useEffect, useMemo, useState } from "react";
import { createTransaction, getTransactionItemsForEdit, getWorkspaceSuggestions, searchTransactionNotes, updateTransaction } from "@/app/actions";
import { getCategoryOptions, type CategoryType } from "@/lib/category-options";
import { TransactionFormFields } from "@/components/transaction-form-fields";
import { TransactionFormActions } from "@/components/transaction-form-actions";
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
  const [category, setCategory] = useState<string>(() => isEditing ? (transaction.category || getCategoryOptions("expense")[0]) : getCategoryOptions("expense")[0]);
  const [merchant, setMerchant] = useState<string>(() => isEditing ? (transaction.merchant || "") : "");
  const [description, setDescription] = useState<string>(() => isEditing ? (transaction.notes || "") : "");
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [amount, setAmount] = useState<string>(() => isEditing ? String(Math.abs(Number(transaction.amount || 0))) : "");

  const categoryOptions = useMemo(() => getCategoryOptions(type, customCategories[type]), [type, customCategories]);
  const merchantOptions = useMemo(() => [...new Set([...customMerchants, ...(isEditing && transaction?.merchant ? [transaction.merchant] : [])])].sort((a, b) => a.localeCompare(b)), [customMerchants, isEditing, transaction?.merchant]);
  const computedAmount = useMemo(() => items.reduce((total, item) => total + (Number(item.total_price) || Number(item.quantity || 1) * Number(item.unit_price || 0)), 0), [items]);

  useEffect(() => {
    if (!transaction?.id) return;

    let active = true;
    getTransactionItemsForEdit(transaction.id).then((loadedItems) => {
      if (!active) return;
      setItems(loadedItems);
      setShowItemDetails(loadedItems.length > 0);
      if (loadedItems.length === 0) {
        setAmount(String(Math.abs(Number(transaction.amount || 0))));
      }
    });

    return () => {
      active = false;
    };
  }, [transaction?.id]);

  useEffect(() => {
    let active = true;
    getWorkspaceSuggestions().then(({ categories, merchants }) => {
      if (!active) return;
      setCustomCategories(categories);
      setCustomMerchants(merchants);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (description.trim().length < 2) {
      setDescriptionSuggestions([]);
      return;
    }

    let active = true;
    const timeout = setTimeout(() => {
      searchTransactionNotes(description).then((suggestions) => {
        if (active) setDescriptionSuggestions(suggestions);
      });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [description]);

  return (
    <form className="space-y-4" action={async (fd) => { const r = await (isEditing ? updateTransaction(transaction.id, fd) : createTransaction(fd)); if (r?.success) onClose(); else setError(r?.error || "Failed to save transaction."); }}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="items_json" value={JSON.stringify(items)} />
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
        computedAmount={computedAmount}
        currency={currency}
        error={error}
        transaction={transaction}
      />
      <TransactionFormActions onClose={onClose} isEditing={isEditing} isDeleting={isDeleting} setIsDeleting={setIsDeleting} transaction={transaction} setError={setError} hasAccounts={accounts.length > 0} />
    </form>
  );
}
