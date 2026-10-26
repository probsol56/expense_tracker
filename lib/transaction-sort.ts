export type TransactionSortOrder = "asc" | "desc";

export function parseTransactionSortOrder(value: string | undefined): TransactionSortOrder {
  return value === "asc" ? "asc" : "desc";
}
