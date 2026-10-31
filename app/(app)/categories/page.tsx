import { Card } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { SignedOutNotice } from "@/components/signed-out-notice";
import { CategoryRow } from "@/components/category-row";
import { CategoryCreateForm } from "@/components/category-create-form";
import { PICKER_LIMITS } from "@/lib/pagination";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !supabase || !workspace) {
    return (
      <SignedOutNotice
        title="Sign in to manage categories"
        description="Create a workspace first, then return here to organize your income and expense categories."
      />
    );
  }

  // Shown grouped by type, so this is capped rather than paged.
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, type, color")
    .eq("workspace_id", workspace.id)
    .order("type", { ascending: true })
    .order("name", { ascending: true })
    .limit(PICKER_LIMITS.categories);
  if (categoriesError) throw categoriesError;

  const error = (await searchParams)?.error;
  const groups = [
    { title: "Expense", categories: (categories ?? []).filter((category) => category.type === "expense") },
    { title: "Income", categories: (categories ?? []).filter((category) => category.type === "income") },
    { title: "Loan", categories: (categories ?? []).filter((category) => category.type === "loan") },
  ];

  return (
    <div className="w-full">
      <PageHeader
        eyebrow={workspace.name}
        title="Categories"
        description="Grouped by type, so the transaction form only offers the ones that fit."
      />
      <div className="mb-6 flex justify-end">
        <CategoryCreateForm error={error} />
      </div>

      <Section title="Saved categories">
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.title} className="min-w-0 p-4 sm:p-5">
              <h3 className="flex items-baseline justify-between gap-2 border-b-2 border-fg/70 pb-2">
                <span className="font-display text-lg font-medium text-fg">{group.title}</span>
                <span className="text-sm tabular-nums text-fg-muted">{group.categories.length}</span>
              </h3>
              {group.categories.length ? (
                <ul>
                  {group.categories.map((category) => (
                    <CategoryRow key={category.id} category={category} />
                  ))}
                </ul>
              ) : (
                <p className="py-3 text-sm text-fg-muted">None yet.</p>
              )}
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
