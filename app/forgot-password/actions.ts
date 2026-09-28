"use server";

import { createClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { AUTH_ROUTES, authCallbackUrl } from "@/lib/auth-routes";
import { passwordResetRequestSchema } from "@/lib/validations";

const HTTP_TOO_MANY_REQUESTS = 429;

export type ResetRequestState = { status: "idle" | "sent" | "error"; message: string };

export async function requestPasswordReset(_prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const parsed = passwordResetRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: authCallbackUrl(config.siteUrl, AUTH_ROUTES.resetPassword),
  });
  if (error?.status === HTTP_TOO_MANY_REQUESTS) {
    return { status: "error", message: "Too many reset requests. Wait a few minutes and try again." };
  }
  if (error) console.error("password reset request failed", error.code ?? error.status);

  // Same answer whether or not the address has an account, so this form
  // can't be used to find out who is registered.
  return { status: "sent", message: "If that address has an account, a reset link is on its way. It works in this browser only." };
}
