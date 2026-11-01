"use client";

import { useMemo } from "react";
import {
  ArcElement,
  Chart as ChartJS,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formatSpendingMonth, getCategorySpendingBreakdown, shiftSpendingMonth } from "@/lib/dashboard-month";
import { LoadingOverlay } from "@/components/ui";
import type { CategorySpending } from "@/lib/dashboard";
import { money } from "@/lib/utils";

ChartJS.register(ArcElement, Tooltip);

const MIN_SPENDING_MONTH = "1900-01";
const FALLBACK_COLORS = ["#2e6a4d", "#876a26", "#53798c", "#a23e2b", "#6d648c", "#be6c3b"];
const OTHER_COLOR = "#64748b";

export function CategorySpendingChart({
  categories,
  categoryColors,
  currency,
  month,
  currentMonth,
  onMonthChange,
  onAddExpense,
  isPending,
}: {
  categories: CategorySpending[];
  categoryColors: Record<string, string>;
  currency: string;
  month: string;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onAddExpense: () => void;
  isPending: boolean;
}) {
  const monthLabel = formatSpendingMonth(month);
  const total = categories.reduce((sum, category) => sum + category.amount, 0);
  const { chartCategories, otherCategories } = useMemo(
    () => getCategorySpendingBreakdown(categories),
    [categories],
  );
  const previousMonth = shiftSpendingMonth(month, -1);
  const nextMonth = shiftSpendingMonth(month, 1);
  const colors = useMemo(() => {
    const usedColors = new Set<string>();
    return chartCategories.map((category, index) => {
      if (category.isOther) return OTHER_COLOR;

      const selectedColor = categoryColors[category.category_name];
      const validColor = selectedColor && /^#[\da-f]{6}$/i.test(selectedColor) ? selectedColor : undefined;
      const uniqueColor = validColor && !usedColors.has(validColor.toLowerCase()) ? validColor : undefined;
      const color = uniqueColor ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? OTHER_COLOR;
      usedColors.add(color.toLowerCase());
      return color;
    });
  }, [categoryColors, chartCategories]);

  const chartData = useMemo<ChartData<"doughnut", number[], string>>(
    () => ({
      labels: chartCategories.map((category) => category.category_name),
      datasets: [
        {
          data: chartCategories.map((category) => category.amount),
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    }),
    [chartCategories, colors],
  );

  const chartOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      cutout: "72%",
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const share = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
              return `${money(context.parsed, currency)} · ${share}%`;
            },
          },
        },
      },
    }),
    [currency, total],
  );

  return (
    <section
      aria-labelledby="category-spending-title"
      aria-busy={isPending}
      className="mb-10 rounded-lg border border-rule bg-paper p-5 sm:p-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="category-spending-title" className="font-display text-xl font-medium text-fg">
            Spending by category
          </h2>
          <p className="mt-1 text-sm text-fg-muted">See where your expenses went each month.</p>
        </div>
        <nav aria-label="Choose spending month" className="flex items-center gap-2 self-center sm:self-auto">
          <button
            type="button"
            aria-label={`Show ${formatSpendingMonth(previousMonth)} spending`}
            disabled={isPending || month <= MIN_SPENDING_MONTH}
            onClick={() => onMonthChange(previousMonth)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-rule text-fg transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <time
            dateTime={`${month}-01`}
            aria-live="polite"
            className="min-w-36 text-center text-base font-medium text-fg"
          >
            {monthLabel}
          </time>
          <button
            type="button"
            aria-label={`Show ${formatSpendingMonth(nextMonth)} spending`}
            disabled={isPending || month >= currentMonth}
            onClick={() => onMonthChange(nextMonth)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-rule text-fg transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </nav>
      </header>

      <div className="relative mt-6 min-h-60" aria-live="polite">
        {categories.length === 0 || total <= 0 ? (
          <div className="rounded-md border border-dashed border-rule px-4 py-8 text-center">
            <p className="text-sm text-fg-muted">
              No expenses recorded in {monthLabel}. Add an expense with a category to see your breakdown.
            </p>
            <button
              type="button"
              onClick={onAddExpense}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-cover px-4 text-sm font-medium text-cover-fg transition-colors hover:bg-cover/90"
            >
              Add expense
            </button>
          </div>
        ) : (
          <div className="grid items-center gap-5 md:grid-cols-[minmax(0,256px)_minmax(0,1fr)] md:gap-6">
            <div className="relative mx-auto w-full max-w-64">
              <div
                role="img"
                aria-label={`${monthLabel} expense breakdown. ${chartCategories
                  .map((category) => `${category.category_name}: ${money(category.amount, currency)}`)
                  .join("; ")}`}
              >
                <Doughnut data={chartData} options={chartOptions} />
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">Total spent</span>
                <span className="mt-1 max-w-[85%] truncate text-center text-lg font-semibold tabular-nums text-fg">
                  {money(total, currency)}
                </span>
              </div>
            </div>
            <ol aria-label={`${monthLabel} expenses ranked by category`} className="divide-y divide-rule">
              {chartCategories.map((category, index) => {
                const share = Math.round((category.amount / total) * 100);
                const color = colors[index] ?? OTHER_COLOR;

                return (
                  <li
                    key={category.category_id ?? `${category.category_name}-${category.isOther ? "other" : "category"}`}
                    className="py-1"
                  >
                    {category.isOther ? (
                      <details className="group">
                        <summary className="grid min-h-11 cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-x-3 rounded-sm focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden sm:grid-cols-[minmax(0,1fr)_auto_3rem]">
                          <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
                            <span className="truncate text-sm font-medium text-fg">{category.category_name}</span>
                            <span className="flex shrink-0 items-center gap-0.5 text-xs text-fg-muted">
                              <span>View {otherCategories.length}</span>
                              <ChevronDown
                                size={14}
                                aria-hidden="true"
                                className="transition-transform group-open:rotate-180"
                              />
                            </span>
                          </span>
                          <span className="whitespace-nowrap text-right text-sm tabular-nums text-fg">
                            {money(category.amount, currency)}
                          </span>
                          <span className="text-right text-xs tabular-nums text-fg-muted">{share}%</span>
                        </summary>
                        <ul aria-label="Categories included in Other categories" className="mt-1 divide-y divide-rule border-t border-rule pl-5 sm:pl-6">
                          {otherCategories.map((otherCategory) => (
                            <li
                              key={otherCategory.category_id ?? otherCategory.category_name}
                              className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-x-3 py-1 text-sm sm:grid-cols-[minmax(0,1fr)_auto_3rem]"
                            >
                              <span className="min-w-0 truncate text-fg-muted">{otherCategory.category_name}</span>
                              <span className="whitespace-nowrap text-right tabular-nums text-fg">
                                {money(otherCategory.amount, currency)}
                              </span>
                              <span className="text-right text-xs tabular-nums text-fg-muted">
                                {Math.round((otherCategory.amount / total) * 100)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <div className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto_2.75rem] items-center gap-x-3 sm:grid-cols-[minmax(0,1fr)_auto_3rem]">
                        <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                          <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
                          <span className="truncate text-sm font-medium text-fg">{category.category_name}</span>
                        </span>
                        <span className="whitespace-nowrap text-right text-sm tabular-nums text-fg">
                          {money(category.amount, currency)}
                        </span>
                        <span className="text-right text-xs tabular-nums text-fg-muted">{share}%</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        <LoadingOverlay show={isPending} className="rounded-md" />
      </div>
    </section>
  );
}
