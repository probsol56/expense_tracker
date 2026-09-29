"use client";

import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { importBankCsv } from "./actions";
import { Alert, Field, NativeSelect, SubmitButton } from "@/components/ui";

export interface ImportTarget {
  id: string;
  name: string;
  institution: string | null;
  last_four: string | null;
}

type ImportResult = { tone: "error" | "warning" | "info"; message: string };

export function ImportForm({ bankAccounts }: { bankAccounts: ImportTarget[] }) {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  return (
    <form
      action={async (formData) => {
        const outcome = await importBankCsv(formData);
        if (outcome.error) setResult({ tone: "error", message: outcome.error });
        else if (outcome.warning) setResult({ tone: "warning", message: outcome.warning });
        else setResult({ tone: "info", message: "Import complete." });
      }}
      className="space-y-5"
    >
      <Field label="Bank account" htmlFor="import-bank-account">
        <NativeSelect id="import-bank-account" name="bank_account_id" required defaultValue="">
          <option value="">Choose a bank account</option>
          {bankAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
              {account.institution ? ` · ${account.institution}` : ""}
              {account.last_four ? ` ····${account.last_four}` : ""}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-medium text-fg">Statement file</legend>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-rule bg-canvas px-6 py-10 text-center transition-colors duration-150 hover:border-brass has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brass-strong">
          <FileSpreadsheet className="h-7 w-7 text-fg-muted" aria-hidden="true" />
          <span className="mt-3 break-all font-medium text-fg">{fileName || "Choose a CSV file"}</span>
          <span className="mt-1 text-sm text-fg-muted">
            Needs columns <code className="font-mono text-fg">date</code>, <code className="font-mono text-fg">merchant</code> and{" "}
            <code className="font-mono text-fg">amount</code>. Up to 5 MB.
          </span>
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
          />
        </label>
      </fieldset>

      {result && (
        <Alert
          tone={result.tone}
          className={result.tone === "info" ? "border-moss/30 bg-moss/10 font-medium text-moss" : undefined}
        >
          {result.message}
        </Alert>
      )}

      <SubmitButton loadingText="Importing..." className="w-full sm:w-auto">
        <Upload size={16} aria-hidden="true" /> Import statement
      </SubmitButton>
    </form>
  );
}
