import Link from "next/link";
import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { SignedOutNotice } from "@/components/signed-out-notice";
import { createMerchant } from "@/app/(app)/merchants/actions";
import { UrlPaginationBar } from "@/components/url-pagination-bar";
import { MERCHANT_PAGE_SIZE, fetchPage, pageInfo, parsePage } from "@/lib/pagination";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !supabase || !workspace) {
    return (
      <SignedOutNotice
        title="Sign in to manage merchants"
        description="Create a workspace first, then return here to add your merchant names."
      />
    );
  }

  const merchants = await fetchPage(
    () =>
      supabase
        .from("merchants")
        .select("id, name", { count: "exact" })
        .eq("workspace_id", workspace.id)
        .order("name", { ascending: true })
        .order("id", { ascending: true }),
    parsePage(params?.page ?? ""),
    MERCHANT_PAGE_SIZE,
  );

  const error = params?.error;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={`${workspace.name} · ${merchants.totalCount} ${merchants.totalCount === 1 ? "merchant" : "merchants"}`}
        title="Merchants"
        description="Shared across the workspace and offered when you record a transaction."
      >
        <Button variant="outline" asChild>
          <Link href="/settings">Back to settings</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <Section title="Saved merchants">
          <Card className="overflow-hidden">
            {merchants.rows.length > 0 ? (
              <>
                <ul className="grid sm:grid-cols-2">
                  {merchants.rows.map((merchant) => (
                    <li key={merchant.id} className="break-words border-b border-rule px-5 py-3 text-fg sm:odd:border-r">
                      {merchant.name}
                    </li>
                  ))}
                </ul>
                <div className="px-5 pb-4">
                  <UrlPaginationBar pagination={pageInfo(merchants)} />
                </div>
              </>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="font-display text-xl font-medium text-fg">No merchants yet</p>
                <p className="mx-auto mt-2 max-w-prose text-sm text-fg-muted">
                  Add one here, or record a transaction and its merchant is saved automatically.
                </p>
              </div>
            )}
          </Card>
        </Section>

        <Section title="Add a merchant">
          <Card className="p-5">
            <form action={createMerchant} className="space-y-4">
              <Field label="Name" htmlFor="merchant-name">
                <Input
                  id="merchant-name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="e.g. Apple Store, Netflix"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "merchant-error" : undefined}
                />
              </Field>
              {error && (
                <div id="merchant-error">
                  <Alert>{error}</Alert>
                </div>
              )}
              <Button type="submit" className="w-full">
                Save merchant
              </Button>
            </form>
          </Card>
        </Section>
      </div>
    </div>
  );
}
