import type { ReactNode } from "react";

/** Opening block shared by every app page: eyebrow, Fraunces title, optional lede and actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Page-level actions, right-aligned on wide screens. */
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="min-h-5 text-sm text-fg-muted">{eyebrow}</p>}
        <h1 className="mt-1 text-balance font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-pretty text-fg-muted">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
