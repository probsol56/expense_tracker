"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { CategoryType } from "@/lib/category-options";

interface TransactionTypeToggleProps {
  type: CategoryType;
  setType: (type: CategoryType) => void;
}

export function TransactionTypeToggle({ type, setType }: TransactionTypeToggleProps) {
  const types: { value: CategoryType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "expense", label: "Expense", icon: <ArrowDownRight size={15} aria-hidden="true" />, color: "text-fg" },
    { value: "income", label: "Income", icon: <ArrowUpRight size={15} aria-hidden="true" />, color: "text-moss" },
  ];

  return (
    <div role="group" aria-label="Transaction type" className="mb-5 grid grid-cols-2 gap-1 rounded-md bg-rule/60 p-1">
      {types.map(({ value, label, icon, color }) => (
        <button
          key={value}
          type="button"
          aria-pressed={type === value}
          onClick={() => setType(value)}
          className={`flex min-h-10 items-center justify-center gap-1.5 rounded-sm text-sm font-semibold transition-colors duration-150 ${
            type === value
              ? `bg-paper shadow-sm ${color}`
              : "text-fg-muted hover:text-fg"
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
