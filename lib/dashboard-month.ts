import type { CategorySpending } from "@/lib/dashboard";

const VISIBLE_CATEGORY_COUNT = 5;

export type CompactCategorySpending = CategorySpending & { isOther?: boolean };

export function getCategorySpendingBreakdown(categories: CategorySpending[]): {
  chartCategories: CompactCategorySpending[];
  otherCategories: CategorySpending[];
} {
  if (categories.length <= VISIBLE_CATEGORY_COUNT) {
    return { chartCategories: categories, otherCategories: [] };
  }

  const visible = categories.slice(0, VISIBLE_CATEGORY_COUNT);
  const otherCategories = categories.slice(VISIBLE_CATEGORY_COUNT);
  const otherAmount = otherCategories.reduce((sum, category) => sum + category.amount, 0);

  return {
    chartCategories: [...visible, { category_id: null, category_name: "Other categories", amount: otherAmount, isOther: true }],
    otherCategories,
  };
}

export function formatSpendingMonth(monthKey: string): string {
  const [yearText, monthText] = monthKey.split("-");
  return new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shiftSpendingMonth(monthKey: string, amount: number): string {
  const [yearText, monthText] = monthKey.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}
