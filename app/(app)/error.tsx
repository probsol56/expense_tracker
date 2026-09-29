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
    <div role="alert" className="mx-auto max-w-xl rounded-lg border border-rule bg-paper p-8 text-center">
      <h1 className="font-display text-2xl font-medium text-fg">This page couldn&apos;t load</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Something went wrong fetching your data. Your records are unchanged. Try again in a moment.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-fg-muted">Reference: {error.digest}</p>}
      <Button type="button" onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
