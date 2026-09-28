"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_LINK_ERROR, AUTH_ROUTES } from "@/lib/auth-routes";
import { newPasswordSchema } from "@/lib/validations";

// Supabase Auth error codes worth explaining; anything else gets the generic message.
const PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  same_password: "Choose a password different from your current one.",
  weak_password: "That password is too weak. Try a longer one.",
};

export type NewPasswordState = { error: string } | null;

export async function updatePassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your new password." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${AUTH_ROUTES.login}?error=${AUTH_LINK_ERROR}`);

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const known = error.code ? PASSWORD_ERROR_MESSAGES[error.code] : undefined;
    if (known) return { error: known };
    console.error("password update failed", error.code ?? error.status);
    return { error: "Couldn't update your password. Request a new link and try again." };
  }

  redirect(AUTH_ROUTES.home);
}
