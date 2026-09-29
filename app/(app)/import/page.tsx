import { Alert, Card } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { SignedOutNotice } from "@/components/signed-out-notice";
import { PICKER_LIMITS } from "@/lib/pagination";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { ImportForm, type ImportTarget } from "./import-form";

export default async function ImportPage() {
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !supabase || !workspace) {
    return (
      <SignedOutNotice
        title="Sign in to import statements"
        description="Create a workspace first, then return here to upload a bank statement."
      />
    );
  }

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, name, institution, last_four")
    .eq("workspace_id", workspace.id)
    .order("name", { ascending: true })
    .limit(PICKER_LIMITS.accounts);
  if (error) throw error;
  const bankAccounts: ImportTarget[] = data ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={workspace.name}
        title="Import a statement"
        description="Upload a CSV from your bank. Each row is checked before it's added, and rows already imported are skipped."
      />

      <Card className="p-5 sm:p-6">
        {bankAccounts.length ? (
          <ImportForm bankAccounts={bankAccounts} />
        ) : (
          <Alert tone="warning">
            This workspace has no bank accounts set up for importing yet, so there is nothing to import into.
          </Alert>
        )}
      </Card>
    </div>
  );
}
