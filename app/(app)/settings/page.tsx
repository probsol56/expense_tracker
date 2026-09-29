import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { SettingsForm } from "./settings-form";
import { DeleteAccountForm } from "./delete-account-form";

export default async function SettingsPage() {
  const { user, workspace, profile } = await getCurrentWorkspaceAndProfile();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={workspace?.name}
        title="Settings"
        description="Your profile and the workspace's default currency."
      >
        <Button variant="outline" asChild>
          <Link href="/categories">Categories</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/merchants">Merchants</Link>
        </Button>
      </PageHeader>

      <Section title="Profile & workspace" description="Changes apply across your figures and reports straight away." className="mb-10">
        <Card className="p-5 sm:p-6">
          <SettingsForm
            initialProfileName={profile?.full_name ?? ""}
            initialWorkspaceName={workspace?.name ?? ""}
            initialBaseCurrency={workspace?.base_currency ?? "BDT"}
          />
        </Card>
      </Section>

      <Section title="Delete account">
        <Card className="border-brick/40 p-5 sm:p-6">
          <DeleteAccountForm />
        </Card>
      </Section>
    </div>
  );
}
