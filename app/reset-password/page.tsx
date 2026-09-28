import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthMessage, authLinkClass } from "@/components/auth-card";
import { createClient } from "@/lib/supabase/server";
import { AUTH_ROUTES } from "@/lib/auth-routes";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <AuthCard title="Set a new password" subtitle="Choose a password you haven't used here before.">
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4">
          <AuthMessage tone="error">This reset link is invalid or has expired.</AuthMessage>
          <p className="text-center text-xs text-ledger-muted dark:text-ledger-muted-dark">
            <Link href={AUTH_ROUTES.forgotPassword} className={authLinkClass}>
              Request a new link
            </Link>
          </p>
        </div>
      )}
    </AuthCard>
  );
}
