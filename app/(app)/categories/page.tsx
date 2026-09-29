import { Alert, Button, Card, Field, Input, NativeSelect } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { SignedOutNotice } from "@/components/signed-out-notice";
import { createCategory } from "@/app/(app)/categories/actions";
import { DEFAULT_CATEGORY_OPTIONS } from "@/lib/category-options";
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

  const storedExpenseCategories = (categories ?? []).filter((category) => category.type === "expense").map((category) => category.name);
  const storedIncomeCategories = (categories ?? []).filter((category) => category.type === "income").map((category) => category.name);
  const storedLoanCategories = (categories ?? []).filter((category) => category.type === "loan").map((category) => category.name);
  const expenseCategories = [...DEFAULT_CATEGORY_OPTIONS.expense, ...storedExpenseCategories];
  const incomeCategories = [...DEFAULT_CATEGORY_OPTIONS.income, ...storedIncomeCategories];
  const loanCategories = [...DEFAULT_CATEGORY_OPTIONS.loan, ...storedLoanCategories];
  const error = (await searchParams)?.error;
  const groups = [
    { title: "Expense", categories: expenseCategories },
    { title: "Income", categories: incomeCategories },
    { title: "Loan", categories: loanCategories },
  ].map((group) => ({ ...group, categories: [...new Set(group.categories)] }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={workspace.name}
        title="Categories"
        description="Grouped by type, so the transaction form only offers the ones that fit."
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <Section title="Saved categories">
          <Card className="grid divide-y divide-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {groups.map((group) => (
              <div key={group.title} className="min-w-0 p-5">
                <h3 className="flex items-baseline justify-between gap-2 border-b-2 border-fg/70 pb-2">
                  <span className="font-display text-lg font-medium text-fg">{group.title}</span>
                  <span className="text-sm tabular-nums text-fg-muted">{group.categories.length}</span>
                </h3>
                {group.categories.length ? (
                  <ul>
                    {group.categories.map((category) => (
                      <li key={category} className="break-words border-b border-rule py-2 text-sm text-fg last:border-b-0">
                        {category}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-3 text-sm text-fg-muted">None yet.</p>
                )}
              </div>
            ))}
          </Card>
        </Section>

        <Section title="Add a category">
          <Card className="p-5">
            <form action={createCategory} className="space-y-4">
              <Field label="Name" htmlFor="category-name">
                <Input
                  id="category-name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="e.g. Salary or Groceries"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "category-error" : undefined}
                />
              </Field>
              <Field label="Type" htmlFor="category-type">
                <NativeSelect id="category-type" name="type" defaultValue="expense">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="loan">Loan</option>
                </NativeSelect>
              </Field>
              {error && (
                <div id="category-error">
                  <Alert>{error}</Alert>
                </div>
              )}
              <Button type="submit" className="w-full">
                Save category
              </Button>
            </form>
          </Card>
        </Section>
      </div>
    </div>
  );
}
