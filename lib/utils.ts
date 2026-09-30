import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const money = (n: number, currency: string = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      currencyDisplay: "narrowSymbol",
    }).format(n);
  } catch {
    return `${currency || "USD"} ${n.toFixed(2)}`;
  }
};

export function getInitials(name?: string | null): string {
  if (!name) return "W";
  const trimmed = name.trim();
  if (!trimmed) return "W";
  const parts = trimmed.split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts[parts.length - 1] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

export function isLoanCategory(category?: string | null): boolean {
  const normalized = (category ?? "").toLowerCase();
  return normalized.includes("loan") || normalized.includes("mortgage");
}

export function isLoanTransaction(transaction: { amount?: number | string | null; category?: string | null }): boolean {
  if (typeof transaction.amount === "number") return isLoanCategory(transaction.category) && transaction.amount < 0;
  const rawAmount = Number(transaction.amount ?? 0);
  return isLoanCategory(transaction.category) && rawAmount < 0;
}

export function isTransferCategory(category?: string | null): boolean {
  return (category ?? "").trim().toLowerCase() === "transfer";
}

/**
 * Reads a single search-param value from a Next.js searchParams object.
 * Next may pass a value as `string | string[] | undefined`; this normalizes
 * to a single `string` (taking the first array entry when needed).
 */
export function getSearchParam(
  searchParams: Record<string, string | string[] | undefined> | null | undefined,
  key: string,
): string {
  if (!searchParams) return "";
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Entry dates are calendar days ("2026-09-28"); formatting in UTC keeps them on the recorded day in every timezone. */
export function formatEntryDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
}
