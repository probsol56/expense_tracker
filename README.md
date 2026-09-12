# Ledgerly

Ledgerly is a polished expense-tracking MVP built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase SSR primitives. The dashboard currently uses intentional demo transactions/accounts; writes are wired to Supabase for authenticated users.

## Getting started

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Create a Supabase project, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Apply all migrations in `supabase/migrations/` (in filename order) in the Supabase SQL editor. The schema includes profiles, workspaces (personal/household/business with a three-letter base currency), members, legacy manual accounts/transactions, categories, `bank_accounts`, `bank_transactions`, and `import_batches` audit records with owner/member RLS policies.

## Scripts

- `pnpm dev` — local development
- `pnpm typecheck` — strict TypeScript validation
- `pnpm build` — production build

Routes include `/login` (email/password sign-in and sign-up), `/onboarding` (workspace creation), `/transactions` (clearly labelled demo transaction surface), `/accounts` (clearly labelled demo account surface), `/import` (CSV upload action), and `/` (protected dashboard when Supabase environment variables are configured). Middleware refreshes Supabase auth cookies. CSV import accepts `date,merchant,amount` headers, validates rows, writes bank transactions, and records an import audit row. Bank syncing and live dashboard queries remain intentionally incomplete; demo data is explicitly labelled in the detail routes.
