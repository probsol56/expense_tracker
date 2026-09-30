import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

const DROPPED_BREADCRUMB_CATEGORIES = new Set(["console", "ui.input"]);
const NETWORK_BREADCRUMB_CATEGORIES = new Set(["fetch", "xhr"]);

/**
 * Removes everything that can carry user data before an event leaves the app:
 * the signed-in user, cookies (Supabase session), headers, request bodies
 * (form values, amounts, notes) and query strings (URL-driven filters).
 * The stack trace, error message and route are what's left, which is enough
 * to debug with.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripQuery(event.request.url);
  }
  return event;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (breadcrumb.category && DROPPED_BREADCRUMB_CATEGORIES.has(breadcrumb.category)) return null;

  if (breadcrumb.category && NETWORK_BREADCRUMB_CATEGORIES.has(breadcrumb.category) && breadcrumb.data) {
    const { method, status_code: statusCode, url } = breadcrumb.data as Record<string, unknown>;
    breadcrumb.data = { method, status_code: statusCode, url: typeof url === "string" ? stripQuery(url) : undefined };
  }
  return breadcrumb;
}

function stripQuery(url: string): string {
  const queryStart = url.search(/[?#]/);
  return queryStart === -1 ? url : url.slice(0, queryStart);
}
