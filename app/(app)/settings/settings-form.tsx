"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Save } from "lucide-react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SubmitButton,
} from "@/components/ui";
import { updateSettings, type ActionState } from "./actions";

interface SettingsFormProps {
  initialProfileName: string;
  initialWorkspaceName: string;
  initialBaseCurrency: string;
}

export function SettingsForm({
  initialProfileName,
  initialWorkspaceName,
  initialBaseCurrency,
}: SettingsFormProps) {
  const [state, formAction] = useActionState<ActionState | null, FormData>(
    updateSettings,
    null
  );
  const [selectedCurrency, setSelectedCurrency] = useState(initialBaseCurrency || "BDT");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      {showSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-800 shadow-sm transition-all animate-in fade-in slide-in-from-top-1 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:shadow-none">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{state?.message || "Settings successfully updated!"}</span>
        </div>
      )}

      {state?.success === false && (
        <div className="flex items-center gap-2.5 rounded-xl border border-coral-200/80 bg-coral-50/80 p-4 text-xs font-semibold text-coral-700 shadow-sm transition-all animate-in fade-in slide-in-from-top-1 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:shadow-none">
          <AlertCircle className="h-4 w-4 shrink-0 text-coral-600" />
          <span>{state?.message || "An error occurred while saving."}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          Full Name
        </label>
        <Input
          id="full_name"
          name="full_name"
          required
          defaultValue={initialProfileName}
          placeholder="Enter your full name"
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          Workspace Name
        </label>
        <Input
          id="workspace_name"
          name="workspace_name"
          required
          defaultValue={initialWorkspaceName}
          placeholder="e.g. Personal Finances"
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          Default Base Currency
        </label>
        <input type="hidden" name="base_currency" value={selectedCurrency} />
        <Select
          value={selectedCurrency}
          onValueChange={setSelectedCurrency}
        >
          <SelectTrigger id="base_currency" className="h-11">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BDT">BDT (৳ - Bangladeshi Taka)</SelectItem>
            <SelectItem value="USD">USD ($ - US Dollar)</SelectItem>
            <SelectItem value="EUR">EUR (€ - Euro)</SelectItem>
            <SelectItem value="GBP">GBP (£ - British Pound)</SelectItem>
            <SelectItem value="CAD">CAD ($ - Canadian Dollar)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-3">
        <SubmitButton
          loadingText="Saving settings..."
          className="w-full sm:w-auto bg-slate-900 text-white shadow-card hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:shadow-none"
        >
          <Save size={16} className="mr-1.5" />
          Save preferences
        </SubmitButton>
      </div>
    </form>
  );
}

