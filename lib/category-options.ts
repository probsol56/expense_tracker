export type CategoryType = "expense" | "income" | "loan";

export const DEFAULT_CATEGORY_OPTIONS: Record<CategoryType, string[]> = {
  expense: [
    "Groceries",
    "Dining & Food",
    "Transport & Fuel",
    "Entertainment & Subscriptions",
    "Housing & Utilities",
    "Shopping",
    "Health & Wellness",
    "Bills & Utilities",
    "Travel",
    "Other Expense",
  ],
  income: [
    "Salary",
    "Freelance Income",
    "Business Income",
    "Investment Return",
    "Gift & Bonus",
    "Other Income",
  ],
  loan: [
    "Personal Loan",
    "Student Loan",
    "Mortgage",
    "Car Loan",
    "Business Loan",
    "Emergency Loan",
    "Other Loan",
  ],
};

export function getCategoryOptions(type: CategoryType, customCategories: string[] = []) {
  const defaults = DEFAULT_CATEGORY_OPTIONS[type];
  const merged = [...defaults, ...customCategories];
  return [...new Set(merged)].filter(Boolean);
}
