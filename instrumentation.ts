import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

// Runs once per server / edge runtime start. Covers server components, route
// handlers, server actions and middleware.
export function register() {
  Sentry.init(sentryOptions());
}

export const onRequestError = Sentry.captureRequestError;
