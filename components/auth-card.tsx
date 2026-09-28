import { useId, type ComponentProps, type ReactNode } from "react";
import { Fraunces } from "next/font/google";
import { AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui";

const ledgerDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-ledger-display",
  display: "swap",
});

export const authButtonClass =
  "h-11 w-full justify-center bg-ledger-brass text-ledger-cover shadow-none hover:bg-ledger-brass-deep hover:shadow-none focus-visible:ring-ledger-brass/30 dark:bg-ledger-brass-dark dark:text-ledger-cover-dark dark:hover:bg-ledger-brass-dark-deep dark:focus-visible:ring-ledger-brass-dark/30";

export const authLinkClass =
  "font-semibold text-ledger-ink underline-offset-4 hover:underline focus-visible:outline-ledger-brass dark:text-ledger-ink-dark dark:focus-visible:outline-ledger-brass-dark";

/** The ledger-book frame shared by every signed-out page: a cover with the title, and a ruled page for the form. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main
      className={`${ledgerDisplay.variable} grid min-h-screen place-items-center bg-ledger-page dark:bg-ledger-page-dark px-4 py-12 sm:p-6`}
    >
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl shadow-hover">
          {/* Cover — the book's front matter */}
          <div className="bg-ledger-cover px-6 py-8 text-center dark:bg-ledger-cover-dark sm:px-8 sm:py-10">
            <p className="font-ledger text-lg font-semibold tracking-[0.3em] text-ledger-brass dark:text-ledger-brass-dark">
              WALLO
            </p>
            <div className="mx-auto mt-4 h-px w-10 bg-ledger-brass/60 dark:bg-ledger-brass-dark/60" />
            <h1 className="mt-5 font-ledger text-2xl font-semibold text-ledger-cover-text dark:text-ledger-cover-text-dark sm:text-[1.75rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm text-ledger-cover-text/70 dark:text-ledger-cover-text-dark/70">{subtitle}</p>
          </div>

          {/* Page — where the numbers go */}
          <div className="ledger-rules bg-ledger-paper px-6 py-7 dark:bg-ledger-paper-dark sm:px-8 sm:py-8">
            <div className="border-l-2 border-ledger-brass/70 pl-5 dark:border-ledger-brass-dark/60 sm:pl-6">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

type AuthFieldProps = Omit<ComponentProps<typeof Input>, "id" | "className"> & { label: string; icon: LucideIcon };

export function AuthField({ label, icon: Icon, ...inputProps }: AuthFieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-ledger-muted dark:text-ledger-muted-dark"
      >
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          {...inputProps}
          className="h-11 border-ledger-rule bg-ledger-paper pl-10 text-ledger-ink focus-visible:border-ledger-brass focus-visible:ring-ledger-brass/15 dark:border-ledger-rule-dark dark:bg-ledger-paper-dark dark:text-ledger-ink-dark dark:focus-visible:border-ledger-brass-dark"
        />
        <Icon
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ledger-muted dark:text-ledger-muted-dark"
        />
      </div>
    </div>
  );
}

const MESSAGE_TONES = {
  error: {
    icon: AlertCircle,
    className:
      "border-ledger-brick/25 bg-ledger-brick-bg text-ledger-brick dark:border-ledger-brick-dark/30 dark:bg-ledger-brick-bg-dark dark:text-ledger-brick-dark",
  },
  success: {
    icon: CheckCircle2,
    className:
      "border-ledger-brass/30 bg-ledger-paper text-ledger-ink dark:border-ledger-brass-dark/30 dark:bg-ledger-paper-dark dark:text-ledger-ink-dark",
  },
} as const;

export function AuthMessage({ tone, children }: { tone: keyof typeof MESSAGE_TONES; children: ReactNode }) {
  const { icon: Icon, className } = MESSAGE_TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-xs font-medium ${className}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
