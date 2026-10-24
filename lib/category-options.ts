export type CategoryType = "expense" | "income" | "loan";

export function getCategoryOptions(categories: string[] = []) {
  return [...new Set(categories)].filter(Boolean);
}
