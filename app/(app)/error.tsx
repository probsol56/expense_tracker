"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

// Server errors reach the client with the message stripped in production;
// only the digest is safe to show, and it matches the server log entry.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-700 dark:bg-ink-800/70">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">This page couldn&apos;t load</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Something went wrong fetching your data. Your records are unchanged. Try again in a moment.
      </p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-slate-400">Reference: {error.digest}</p>}
      <Button type="button" onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
