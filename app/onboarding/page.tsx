import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace } from "@/app/onboarding/actions";
import { AuthCard, authButtonClass } from "@/components/auth-card";
import { Alert, Field, Input, NativeSelect, SubmitButton } from "@/components/ui";

// Requires an authenticated session — never let it be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? error : null;

  return (
    <AuthCard title="Open your first ledger" subtitle="A workspace holds your accounts, transactions and loans.">
      {errorMessage && <Alert className="mb-4">{errorMessage}</Alert>}
      <form action={createWorkspace} className="space-y-4">
        <Field label="Workspace name" htmlFor="workspace-name">
          <Input id="workspace-name" name="name" required placeholder="e.g. Personal, Family, Consulting" />
        </Field>

        <Field label="Type" htmlFor="workspace-type">
          <NativeSelect id="workspace-type" name="workspace_type" defaultValue="personal">
            <option value="personal">Personal finances</option>
            <option value="household">Household & family</option>
            <option value="business">Business or freelance</option>
          </NativeSelect>
        </Field>

        <Field label="Base currency" htmlFor="workspace-currency">
          <NativeSelect id="workspace-currency" name="base_currency" defaultValue="BDT">
            <option value="BDT">BDT (৳, Bangladeshi taka)</option>
            <option value="USD">USD ($, US dollar)</option>
            <option value="EUR">EUR (€, euro)</option>
            <option value="GBP">GBP (£, British pound)</option>
            <option value="CAD">CAD ($, Canadian dollar)</option>
          </NativeSelect>
        </Field>

        <SubmitButton loadingText="Creating workspace..." className={authButtonClass}>
          Create workspace
          <ArrowRight size={16} aria-hidden="true" />
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
