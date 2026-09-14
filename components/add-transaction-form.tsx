"use client";

import { useEffect, useMemo, useState } from "react";
import { createTransaction, updateTransaction } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
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
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transaction_items")
        .select("id, name, quantity, unit_price, total_price")
        .eq("transaction_id", transaction.id);

      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }

      const loadedItems = (data ?? []).map((item: TransactionItem) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        total_price: Number(item.total_price) || 0,
      }));
      setItems(loadedItems);
      setShowItemDetails(loadedItems.length > 0);
      if (loadedItems.length === 0) {
        setAmount(String(Math.abs(Number(transaction.amount || 0))));
      }
    })();

    return () => {
      active = false;
    };
  }, [transaction?.id]);

  useEffect(() => {
    if (!categoryOptions.length) setCategory("");
    else if (!categoryOptions.includes(category)) setCategory(categoryOptions[0]);
  }, [categoryOptions, category]);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const workspace = await getWorkspace(supabase, user.id);
      if (!workspace?.id) {
        setCustomCategories({ expense: [], income: [], loan: [] });
        setCustomMerchants([]);
        return;
      }
      const [{ data: categoryRows, error: categoryError }, { data: merchantRows, error: merchantError }] = await Promise.all([
        supabase.from("categories").select("name, type").eq("workspace_id", workspace.id).order("name", { ascending: true }),
        supabase.from("merchants").select("name").eq("workspace_id", workspace.id).order("name", { ascending: true }),
      ]);
      if (!active) return;
      if (categoryError) setCustomCategories({ expense: [], income: [], loan: [] });
      else setCustomCategories(buildCategories(categoryRows ?? []));
      if (merchantError) setCustomMerchants([]);
      else {
        const rows = merchantRows ?? [];
        const names = rows.map((row) => row.name).filter(Boolean);
        setCustomMerchants(names);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const query = description.trim();
    if (query.length < 2) {
      setDescriptionSuggestions([]);
      return;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const workspace = await getWorkspace(supabase, user.id);
      if (!workspace?.id || !active) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("notes")
        .eq("workspace_id", workspace.id)
        .not("notes", "is", null)
        .ilike("notes", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(8);

      if (!active || error) return;

      const suggestions = Array.from(
        new Set(
          (data ?? [])
            .map((row) => row.notes)
            .filter((value): value is string => Boolean(value))
            .map((value) => value.trim())
            .filter((value) => value && value.toLowerCase() !== query.toLowerCase())
        )
      );

      setDescriptionSuggestions(suggestions.slice(0, 8));
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [description]);

  return (
    <form className="space-y-4" action={async (fd) => { const r = await (isEditing ? updateTransaction(transaction.id, fd) : createTransaction(fd)); r?.success ? onClose() : setError(r?.error || "Failed to save transaction."); }}>
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

async function getWorkspace(supabase: any, userId: string) {
  const { data: owned } = await supabase.from("workspaces").select("id").eq("owner_id", userId).limit(1).maybeSingle();
  if (owned) return owned;
  const { data: membership } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
  return membership ? { id: membership.workspace_id } : null;
}

function buildCategories(rows: any[]) {
  const cats: Record<string, string[]> = { expense: [], income: [], loan: [] };
  rows?.forEach(row => {
    if (row.type === "income") cats.income.push(row.name);
    else if (row.type === "loan") cats.loan.push(row.name);
    else cats.expense.push(row.name);
  });
  return cats;
}
