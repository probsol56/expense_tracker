import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent } from "@/lib/sentry-scrub";

describe("scrubEvent", () => {
  it("removes the user, cookies, headers, body and query string", () => {
    const event: ErrorEvent = {
      type: undefined,
      message: "boom",
      user: { id: "u1", email: "a@b.co", ip_address: "1.2.3.4" },
      request: {
        url: "https://wallo.example/transactions?search=rent&page=2",
        cookies: { "sb-access-token": "secret" },
        headers: { cookie: "sb=secret" },
        data: { amount: "120.50", notes: "landlord" },
        query_string: "search=rent",
      },
    };

    const scrubbed = scrubEvent(event);

    expect(scrubbed.user).toBeUndefined();
    expect(scrubbed.request).toEqual({ url: "https://wallo.example/transactions" });
    expect(scrubbed.message).toBe("boom");
  });

  it("copes with an event that has no request", () => {
    expect(scrubEvent({ type: undefined, message: "boom" }).message).toBe("boom");
  });
});

describe("scrubBreadcrumb", () => {
  it("drops console and input breadcrumbs, which can echo user-typed values", () => {
    expect(scrubBreadcrumb({ category: "console", message: "user@x.co" })).toBeNull();
    expect(scrubBreadcrumb({ category: "ui.input", message: "input[name=notes]" })).toBeNull();
  });

  it("keeps only method, status and path for network breadcrumbs", () => {
    const kept = scrubBreadcrumb({
      category: "fetch",
      data: { method: "GET", status_code: 200, url: "https://x.supabase.co/rest/v1/accounts?select=*&name=eq.Salary", body: "x" },
    });

    expect(kept?.data).toEqual({ method: "GET", status_code: 200, url: "https://x.supabase.co/rest/v1/accounts" });
  });

  it("passes other breadcrumbs through", () => {
    expect(scrubBreadcrumb({ category: "navigation", data: { to: "/loans" } })).toEqual({ category: "navigation", data: { to: "/loans" } });
  });
});
