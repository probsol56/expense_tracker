import Link from "next/link";
import { ArrowLeft, BadgeDollarSign, CirclePlus, PiggyBank } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { createCategory } from "@/app/(app)/categories/actions";
import { DEFAULT_CATEGORY_OPTIONS } from "@/lib/category-options";
import { getCurrentWorkspaceAndProfile } from "@/lib/workspace";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { user, workspace, supabase } = await getCurrentWorkspaceAndProfile();
  if (!user || !supabase || !workspace) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-slate-900">Sign in to manage categories</h1>
        <p className="mt-2 text-sm text-slate-500">
          Create a workspace first, then return here to organize your income and expense categories.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Go to login
        </Link>
      </div>
    );
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type, color")
    .eq("workspace_id", workspace.id)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  const storedExpenseCategories = (categories ?? []).filter((category) => category.type === "expense").map((category) => category.name);
  const storedIncomeCategories = (categories ?? []).filter((category) => category.type === "income").map((category) => category.name);
  const storedLoanCategories = (categories ?? []).filter((category) => category.type === "loan").map((category) => category.name);
  const expenseCategories = [...DEFAULT_CATEGORY_OPTIONS.expense, ...storedExpenseCategories];
  const incomeCategories = [...DEFAULT_CATEGORY_OPTIONS.income, ...storedIncomeCategories];
  const loanCategories = [...DEFAULT_CATEGORY_OPTIONS.loan, ...storedLoanCategories];
  const error = (await searchParams)?.error;

  return (
    <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:border-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
              <BadgeDollarSign size={12} /> Category library
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Income, Expense & Loan categories
            </h1>
          </div>
          <Link href="/settings" className="inline-flex items-center justify-center">
            <Button variant="outline">Back to settings</Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden shadow-card">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-ink-900/60 p-6">
              <CardTitle className="text-lg sm:text-xl">Saved categories</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Categories are organized by type so the transaction form only shows relevant options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <ArrowLeft size={15} className="rotate-[-90deg] text-coral-500" />
                  Expense categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {expenseCategories.length ? (
                    [...new Set(expenseCategories)].map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center rounded-full border border-coral-200 bg-coral-50 px-2.5 py-1 text-xs font-semibold text-coral-700 dark:border-coral-500/30 dark:bg-coral-500/10 dark:text-coral-300"
                      >
                        {category}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No expense categories yet.</span>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <PiggyBank size={15} className="text-teal-500" />
                  Income categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {incomeCategories.length ? (
                    [...new Set(incomeCategories)].map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300"
                      >
                        {category}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No income categories yet.</span>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <PiggyBank size={15} className="text-amber-500" />
                  Loan categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {loanCategories.length ? (
                    [...new Set(loanCategories)].map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                      >
                        {category}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No loan categories yet.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CirclePlus size={18} className="text-teal-600" /> Add category
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Create new categories for your workspace and keep them separated by type.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form action={createCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="category-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category name
                  </label>
                  <input
                    id="category-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="e.g. Salary or Groceries"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-ink-900 dark:text-slate-100 dark:focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="category-type" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Type
                  </label>
                  <select
                    id="category-type"
                    name="type"
                    defaultValue="expense"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-700 dark:bg-ink-900 dark:text-slate-100 dark:focus:border-teal-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="loan">Loan</option>
                  </select>
                </div>

                {error && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full justify-center">
                  Save category
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
