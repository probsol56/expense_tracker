import { z } from "zod";
import { config } from "@/lib/config";
import { getFolioApiKey } from "@/lib/server-config";

// Server-only client for the Aqlyn Folio report server's HTTP API.
// The API key has admin rights there, so these calls never run in the browser;
// the browser only ever receives a short-lived view token for one report.

export type FolioParamValue = string | number | boolean | string[] | number[];

const viewTokenResponseSchema = z.object({
  token: z.string().min(1),
  expires: z.string(),
});

export type FolioViewToken = z.infer<typeof viewTokenResponseSchema>;

/** A non-2xx response from Folio; carries the status only, never the key or body. */
export class FolioRequestError extends Error {
  constructor(readonly status: number) {
    super(`Folio request failed with status ${status}`);
    this.name = "FolioRequestError";
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Mints a view token for one report with its parameters locked: the viewer
 * can show, print and export that report but can't change these values.
 */
export async function createFolioViewToken({
  report,
  params,
  minutes,
}: {
  report: string;
  params: Record<string, FolioParamValue>;
  minutes: number;
}): Promise<FolioViewToken> {
  if (typeof window !== "undefined") {
    throw new Error("createFolioViewToken() must only run on the server.");
  }
  const baseUrl = config.folioReportsUrl;
  if (!baseUrl) {
    throw new Error("Invalid environment configuration:\n- NEXT_PUBLIC_FOLIO_REPORTS_URL: required for reports");
  }

  const response = await fetch(`${baseUrl}/api/view-tokens`, {
    method: "POST",
    headers: { "X-Api-Key": getFolioApiKey(), "Content-Type": "application/json" },
    body: JSON.stringify({ report, params, minutes }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new FolioRequestError(response.status);

  return viewTokenResponseSchema.parse(await response.json());
}
