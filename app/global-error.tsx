"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Replaces the root layout when it throws, so it has to bring its own <html>
// and can't rely on the app's styles or components.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", minHeight: "100vh", placeItems: "center", margin: 0 }}>
        <div role="alert" style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20 }}>Something went wrong</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Your records are unchanged. Try again in a moment.</p>
          {error.digest && <p style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 11 }}>Reference: {error.digest}</p>}
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "8px 16px" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
