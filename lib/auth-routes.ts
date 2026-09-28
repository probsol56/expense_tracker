export const AUTH_ROUTES = {
  login: "/login",
  callback: "/auth/callback",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  onboarding: "/onboarding",
  home: "/",
} as const;

export const AUTH_LINK_ERROR = "link";

/**
 * Only same-origin paths may be used as a post-auth redirect; anything else
 * (absolute URLs, protocol-relative `//evil.com`, backslash tricks) falls back
 * to home, so an emailed link can't be rewritten into an open redirect.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return AUTH_ROUTES.home;
  }
  return value;
}

/** Absolute callback URL Supabase puts in the email, landing on `next` once the code is exchanged. */
export function authCallbackUrl(siteUrl: string, next: string): string {
  const url = new URL(AUTH_ROUTES.callback, siteUrl);
  url.searchParams.set("next", next);
  return url.toString();
}
