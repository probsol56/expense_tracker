import { config } from "@/lib/config";
import { hasFolioApiKey } from "@/lib/server-config";
import { PICKER_LIMITS } from "@/lib/pagination";
import { parseExpenseReportFilters } from "@/lib/expense-report";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";
import { SignedOutNotice } from "@/components/signed-out-notice";
import { ExpenseDetailsContent } from "@/app/(app)/reports/expense-details/expense-details-content";

export default async function ExpenseDetailsReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !supabase || !workspace) {
    return (
      <SignedOutNotice
        title="Sign in to view reports"
        description="Create a workspace first, then return here to run your expense report."
      />
    );
  }

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("workspace_id", workspace.id)
    .eq("type", "expense")
    .order("name", { ascending: true })
    .limit(PICKER_LIMITS.categories);
  if (error) throw error;

  const options = (categories ?? []).map(({ id, name }) => ({ id: String(id), name: String(name) }));
  const knownIds = new Set(options.map(({ id }) => id));
  const filters = parseExpenseReportFilters(sp);

  return (
    <ExpenseDetailsContent
      workspaceName={workspace.name}
      categories={options}
      // Ids from a stale URL (deleted category, other workspace) are dropped
      // here; the server action re-checks ownership regardless.
      filters={{ ...filters, categoryIds: filters.categoryIds.filter((id) => knownIds.has(id)) }}
      folioReportsUrl={config.folioReportsUrl && hasFolioApiKey() ? config.folioReportsUrl : null}
    />
  );
}
