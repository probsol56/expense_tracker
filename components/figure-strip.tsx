import type { ReactNode } from "react";

export interface Figure {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  /** Colour carries meaning only alongside the label, never on its own. */
  tone?: "default" | "positive" | "negative";
}

const TONE_CLASS: Record<NonNullable<Figure["tone"]>, string> = {
  default: "text-fg",
  positive: "text-moss",
  negative: "text-brick",
};

/** A row of headline figures closed with the ledger's double rule. */
export function FigureStrip({ figures, label }: { figures: Figure[]; label: string }) {
  return (
    <section aria-label={label} className="mb-10 border-b-[3px] border-double border-fg/50 pb-6">
      <dl className="grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-rule">
        {figures.map((figure, index) => (
          <div
            key={figure.label}
            className="min-w-0 animate-settle sm:px-6 sm:first:pl-0 sm:last:pr-0"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <dt className="text-xs font-semibold uppercase tracking-widest text-fg-muted">{figure.label}</dt>
            <dd
              className={`mt-1 break-words font-display text-3xl font-medium tabular-nums lining-nums ${
                TONE_CLASS[figure.tone ?? "default"]
              }`}
            >
              {figure.value}
            </dd>
            {figure.detail && <dd className="mt-1 text-sm text-fg-muted">{figure.detail}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
