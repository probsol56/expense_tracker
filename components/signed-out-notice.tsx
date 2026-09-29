import Link from "next/link";

/** Shown by app pages that render without a resolved user/workspace. */
export function SignedOutNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-rule bg-paper p-8 text-center">
      <h1 className="font-display text-2xl font-medium text-fg">{title}</h1>
      <p className="mt-2 text-sm text-fg-muted">{description}</p>
      <Link
        href="/login"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-fg px-5 text-sm font-semibold text-paper transition-colors duration-150 hover:bg-fg/85"
      >
        Go to login
      </Link>
    </div>
  );
}
