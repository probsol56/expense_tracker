"use client";

import { useActionState, useEffect, useState } from "react";
import { Save } from "lucide-react";
import {
  Alert,
  Field,
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
        <Alert tone="info" className="border-moss/30 bg-moss/10 font-medium text-moss">
          {state?.message || "Settings saved."}
        </Alert>
      )}

      {state?.success === false && <Alert>{state?.message || "Your settings couldn't be saved. Try again."}</Alert>}

      <Field label="Full name" htmlFor="full_name">
        <Input id="full_name" name="full_name" required autoComplete="name" defaultValue={initialProfileName} />
      </Field>

      <Field label="Workspace name" htmlFor="workspace_name">
        <Input id="workspace_name" name="workspace_name" required defaultValue={initialWorkspaceName} placeholder="e.g. Personal finances" />
      </Field>

      <Field label="Base currency" htmlFor="base_currency">
        <input type="hidden" name="base_currency" value={selectedCurrency} />
        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
          <SelectTrigger id="base_currency">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BDT">BDT (৳, Bangladeshi taka)</SelectItem>
            <SelectItem value="USD">USD ($, US dollar)</SelectItem>
            <SelectItem value="EUR">EUR (€, euro)</SelectItem>
            <SelectItem value="GBP">GBP (£, British pound)</SelectItem>
            <SelectItem value="CAD">CAD ($, Canadian dollar)</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <SubmitButton loadingText="Saving..." className="w-full sm:w-auto">
        <Save size={16} aria-hidden="true" />
        Save changes
      </SubmitButton>
    </form>
  );
}
