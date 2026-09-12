"use client";

import { useState } from "react";
import { CheckCircle2, FileSpreadsheet, HelpCircle, Upload, ShieldCheck } from "lucide-react";
import { importBankCsv } from "./actions";
import { Button, Card, Input, SubmitButton } from "@/components/ui";

export default function ImportPage() {
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  return (
    <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/70 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:border-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
            Batch Importer
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Import Bank CSV
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Bulk upload transactions from your bank statement. Rows are checked and ledger-synced.
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-card overflow-hidden">
          <form
            action={async (fd) => {
              const result = await importBankCsv(fd);
              setMessage(result.error || (result.warning ?? "Import completed successfully."));
            }}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Workspace UUID
              </label>
              <Input
                name="workspace_id"
                required
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                className="h-11 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Bank Account UUID
              </label>
              <Input
                name="bank_account_id"
                required
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                className="h-11 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                CSV Statement File
              </label>
              <label className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300/80 bg-slate-50/50 p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all duration-200 dark:border-slate-700 dark:bg-ink-800/50 dark:hover:border-teal-700 dark:hover:bg-teal-900/20">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm transition-transform group-hover:scale-110 group-hover:text-teal-600 dark:bg-ink-800 dark:shadow-none">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <span className="mt-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {fileName || "Click to browse or drop CSV here"}
                </span>
                <span className="mt-1 text-[11px] text-slate-400">
                  Required columns: <code className="font-semibold text-slate-600 dark:text-slate-300">date, merchant, amount</code>
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
            </div>

            {message && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 text-xs font-medium text-teal-800 shadow-sm animate-in fade-in dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300 dark:shadow-none">
                {message}
              </div>
            )}

            <div className="pt-2">
              <SubmitButton
                loadingText="Processing batch..."
                className="w-full sm:w-auto bg-slate-900 text-white shadow-card hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:shadow-none"
              >
                <Upload size={16} className="mr-2 inline" /> Import CSV File
              </SubmitButton>
            </div>
          </form>
        </Card>
    </div>
  );
}

