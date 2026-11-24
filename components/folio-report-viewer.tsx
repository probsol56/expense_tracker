"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { RotateCcw } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { ReportPageSkeleton } from "@/components/report-page-skeleton";
import { cn } from "@/lib/utils";

type TokenResult = { token: string } | { error: string };

interface AqlynViewerOptions {
  server: string;
  report: string;
  /** A function lets the viewer fetch a fresh token itself when one expires. */
  token: () => Promise<string>;
}

interface AqlynViewerApi {
  mount: (element: HTMLElement, options: AqlynViewerOptions) => unknown;
}

// viewer.js is third-party code assigning a global, so check its shape
// before calling it rather than trusting a declared type.
function getAqlynViewer(): AqlynViewerApi | null {
  const candidate: unknown = Reflect.get(window, "AqlynViewer");
  if (typeof candidate !== "object" || candidate === null) return null;
  const mount: unknown = Reflect.get(candidate, "mount");
  if (typeof mount !== "function") return null;
  return { mount: (element, options) => Reflect.apply(mount, candidate, [element, options]) };
}

type Status = { kind: "loading" } | { kind: "ready" } | { kind: "error"; message: string };

/**
 * Embeds an Aqlyn Folio report. The browser calls the report server directly,
 * so the server must list this app's origin in AQLYN_CORS_ORIGINS.
 *
 * The page never holds the Folio API key — it
 * asks the server (`getToken`) for a short-lived view token whose parameters
 * are locked, and the viewer re-calls it on expiry.
 *
 * Remount (via `key`) to load the report with different parameters.
 */
export function FolioReportViewer({
  serverUrl,
  report,
  title,
  getToken,
  frameClassName = "h-[75vh] min-h-[32rem] rounded-lg border border-rule bg-paper",
}: {
  serverUrl: string;
  report: string;
  title: string;
  getToken: () => Promise<TokenResult>;
  /** Size and surface of the report frame; defaults to a bordered in-page panel. */
  frameClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    if (!scriptReady) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const run = async () => {
      setStatus({ kind: "loading" });
      const viewer = getAqlynViewer();
      if (!viewer) {
        setStatus({ kind: "error", message: "The report viewer failed to load." });
        return;
      }

      // Fetch the first token ourselves so a bad filter or server error shows
      // as a readable message instead of a broken viewer.
      const first = await getTokenRef.current();
      if (cancelled) return;
      if ("error" in first) {
        setStatus({ kind: "error", message: first.error });
        return;
      }

      let pending: string | null = first.token;
      const token = async (): Promise<string> => {
        if (pending) {
          const initial = pending;
          pending = null;
          return initial;
        }
        const next = await getTokenRef.current();
        if ("error" in next) throw new Error(next.error);
        return next.token;
      };

      container.replaceChildren();
      // The viewer has no destroy(); clearing the container (below) is its teardown.
      viewer.mount(container, { server: serverUrl, report, token });
      setStatus({ kind: "ready" });
    };

    run().catch((caught: unknown) => {
      if (cancelled) return;
      console.error(caught);
      setStatus({ kind: "error", message: "The report couldn't be loaded. Try again in a moment." });
    });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [scriptReady, serverUrl, report, attempt]);

  return (
    <section
      aria-label={title}
      aria-busy={status.kind === "loading"}
      className={cn("relative w-full overflow-hidden", frameClassName)}
    >
      <Script
        src={`${serverUrl}/viewer.js`}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setStatus({ kind: "error", message: "The report viewer couldn't be reached." })}
      />

      <div ref={containerRef} className="h-full w-full" hidden={status.kind === "error"} />

      {status.kind === "loading" && <ReportPageSkeleton className="absolute inset-0" />}

      {status.kind === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-canvas p-4">
          <Alert className="flex max-w-md flex-col items-start gap-3">
            <span>{status.message}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          </Alert>
        </div>
      )}
    </section>
  );
}
