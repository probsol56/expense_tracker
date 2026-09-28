import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AUTH_LINK_ERROR, AUTH_ROUTES, safeNextPath } from "@/lib/auth-routes";

/**
 * Landing point for every emailed auth link (sign-up confirmation, password
 * reset). Supabase appends a PKCE `code`; exchanging it sets the session
 * cookies, then the user continues to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const failed = new URL(AUTH_ROUTES.login, origin);
  failed.searchParams.set("error", AUTH_LINK_ERROR);

  if (!code) return NextResponse.redirect(failed);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  // Also expected when the link is opened in a different browser: the PKCE
  // verifier cookie only exists in the browser that requested it.
  if (error) {
    console.error("auth callback: code exchange failed", error.code ?? error.status);
    return NextResponse.redirect(failed);
  }

  return NextResponse.redirect(new URL(next, origin));
}
