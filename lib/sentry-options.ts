import type { init } from "@sentry/nextjs";
import { config } from "@/lib/config";
import { scrubBreadcrumb, scrubEvent } from "@/lib/sentry-scrub";

type SentryOptions = NonNullable<Parameters<typeof init>[0]>;

/** Shared by the server, edge and browser runtimes so all three scrub the same way. */
export function sentryOptions(): SentryOptions {
  return {
    dsn: config.sentryDsn,
    enabled: config.isProduction && config.sentryDsn !== undefined,
    // Collect nothing beyond the stack trace and message. Local variable values
    // in particular would carry amounts, notes and other ledger data.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
    },
    // Error monitoring only: no performance traces, no session replay.
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  };
}
