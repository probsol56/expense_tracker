"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { CategoryType } from "@/lib/category-options";

interface TransactionTypeToggleProps {
  type: CategoryType;
  setType: (type: CategoryType) => void;
}

export function TransactionTypeToggle({ type, setType }: TransactionTypeToggleProps) {
  const types: { value: CategoryType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "expense", label: "Expense", icon: <ArrowDownRight size={15} />, color: "text-coral-600 dark:text-rose-400" },
    { value: "income", label: "Income", icon: <ArrowUpRight size={15} />, color: "text-teal-700 dark:text-teal-400" },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100/90 dark:bg-ink-800 p-1">
      {types.map(({ value, label, icon, color }) => (
        <button
          key={value}
          type="button"
          aria-pressed={type === value}
          onClick={() => setType(value)}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
            type === value
              ? `bg-white shadow-sm dark:bg-ink-950 ${color}`
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
