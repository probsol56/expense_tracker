export interface SecurityHeaderOptions {
  supabaseUrl: string;
  sentryDsn?: string;
  /** Aqlyn Folio report server whose embedded viewer runs on the reports page. */
  folioReportsUrl?: string;
  isProduction: boolean;
}

export interface Header {
  key: string;
  value: string;
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Next.js App Router streams its RSC payload through inline <script> tags and
// app/layout.tsx injects an inline theme script, so script-src needs
// 'unsafe-inline' unless we move to per-request nonces (which forces every
// page to render dynamically). The remaining directives still block third-party
// scripts, framing, plugin content, <base> hijacking and off-origin form posts.
export function buildContentSecurityPolicy({ supabaseUrl, sentryDsn, folioReportsUrl, isProduction }: SecurityHeaderOptions): string {
  const supabase = new URL(supabaseUrl);
  // The DSN's origin is the region-specific ingest host (e.g. o123.ingest.de.sentry.io);
  // the public key in its userinfo isn't part of `origin`.
  const sentryOrigin = sentryDsn ? [new URL(sentryDsn).origin] : [];
  // The Folio viewer script, its API calls (CORS), fonts.css and font files
  // all come from the report server's origin.
  const folio = folioReportsUrl ? [new URL(folioReportsUrl).origin] : [];
  const supabaseRealtime = `${supabase.protocol === "https:" ? "wss:" : "ws:"}//${supabase.host}`;

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // React's dev build relies on eval for stack reconstruction.
    "script-src": ["'self'", "'unsafe-inline'", ...(isProduction ? [] : ["'unsafe-eval'"]), ...folio],
    "style-src": ["'self'", "'unsafe-inline'", ...folio],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", ...folio],
    "connect-src": ["'self'", supabase.origin, supabaseRealtime, ...sentryOrigin, ...folio],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives).map(([name, sources]) => `${name} ${sources.join(" ")}`);
  if (isProduction) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function buildSecurityHeaders(options: SecurityHeaderOptions): Header[] {
  const headers: Header[] = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];

  // HSTS on localhost would pin the dev origin to HTTPS in the browser.
  if (options.isProduction) {
    headers.push({ key: "Strict-Transport-Security", value: `max-age=${ONE_YEAR_SECONDS}; includeSubDomains` });
  }
  return headers;
}
