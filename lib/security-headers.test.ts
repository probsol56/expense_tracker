import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/lib/security-headers";

const SUPABASE_URL = "https://abc123.supabase.co";

function headerValue(isProduction: boolean, key: string) {
  return buildSecurityHeaders({ supabaseUrl: SUPABASE_URL, isProduction }).find((header) => header.key === key)?.value;
}

describe("buildContentSecurityPolicy", () => {
  it("allows the Supabase REST and realtime origins and nothing else off-site", () => {
    const csp = buildContentSecurityPolicy({ supabaseUrl: SUPABASE_URL, isProduction: true });
    expect(csp).toContain("connect-src 'self' https://abc123.supabase.co wss://abc123.supabase.co");
  });

  it("allows the Sentry ingest origin, without the DSN's public key", () => {
    const csp = buildContentSecurityPolicy({
      supabaseUrl: SUPABASE_URL,
      sentryDsn: "https://examplekey@o123.ingest.de.sentry.io/456",
      isProduction: true,
    });
    expect(csp).toContain("https://o123.ingest.de.sentry.io");
    expect(csp).not.toContain("examplekey");
  });

  it("uses ws: for a local http Supabase", () => {
    const csp = buildContentSecurityPolicy({ supabaseUrl: "http://127.0.0.1:54321", isProduction: false });
    expect(csp).toContain("ws://127.0.0.1:54321");
  });

  it("forbids framing, plugins and off-origin form posts", () => {
    const csp = buildContentSecurityPolicy({ supabaseUrl: SUPABASE_URL, isProduction: true });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("allows eval only in development", () => {
    expect(buildContentSecurityPolicy({ supabaseUrl: SUPABASE_URL, isProduction: true })).not.toContain("unsafe-eval");
    expect(buildContentSecurityPolicy({ supabaseUrl: SUPABASE_URL, isProduction: false })).toContain("unsafe-eval");
  });
});

describe("buildSecurityHeaders", () => {
  it("sends HSTS only in production", () => {
    expect(headerValue(true, "Strict-Transport-Security")).toMatch(/^max-age=\d+; includeSubDomains$/);
    expect(headerValue(false, "Strict-Transport-Security")).toBeUndefined();
  });

  it("always sends nosniff", () => {
    expect(headerValue(false, "X-Content-Type-Options")).toBe("nosniff");
  });
});
