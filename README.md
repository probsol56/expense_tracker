# Wallo

Multi-workspace expense, income, and loan tracker. Next.js App Router + Supabase (Postgres, RLS, `@supabase/ssr`) as a single deployable app — no separate backend service.

Every workspace is `personal`, `household`, or `business`, with its own base currency, owner, and optional members. Transactions, accounts, categories, merchants, and loans are all scoped to the current workspace via RLS.

## Getting started

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Create a Supabase project, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, then apply everything in `supabase/migrations/` in filename order via the Supabase SQL editor (or CLI). Migrations are forward-only and are the source of truth for the schema — no manual dashboard edits.

## Scripts

```
pnpm dev        # local development
pnpm typecheck  # strict TypeScript validation
pnpm lint       # ESLint
pnpm build      # production build
```

No test script exists yet.

## Features

| Route | Status |
|---|---|
| `/login` | Supabase email/password sign-in and sign-up |
| `/onboarding` | Create a workspace (type + base currency) for a new user |
| `/` (dashboard) | Real transaction/account/loan data, merged and paginated server-side |
| `/transactions` | Server-paginated, filterable list; create/update/delete via Server Actions |
| `/accounts` | Create accounts; balance is a DB-trigger-derived running total from linked transactions |
| `/categories`, `/merchants` | Workspace-scoped create + list, resolved-or-created by name |
| `/loans` | Create/edit loans and repayments; disbursements and repayments post real ledger transactions linked back to the loan |
| `/settings` | Update profile name and workspace name/currency |
| `/import` | CSV upload (`date,merchant,amount`, optional `category`) into staging tables (`bank_transactions`, `import_batches`) with dedupe on `external_id` |

Middleware refreshes Supabase auth session cookies on every request.

## Known limitations

- **CSV import doesn't post to the main ledger.** Rows land in `bank_transactions`/`import_batches` staging tables, not `transactions`, and the form requires pasting workspace/bank-account UUIDs manually rather than selecting them.
- **No workspace switcher.** A user's "current" workspace resolves to the one they own, or their first membership — there's no UI to belong to or switch between multiple workspaces yet.
- **No edit/delete UI for categories or merchants** once created.
- **No generated DB types.** `lib/types.ts` is hand-maintained; switch to `supabase gen types typescript` if the schema outgrows it.

## Repository map

```
app/
  (app)/            Authenticated shell — dashboard, transactions, accounts,
                     categories, merchants, loans, settings, import — each with
                     its own page.tsx and, where it mutates data, actions.ts
  actions.ts         Root server actions (transaction create/update/delete)
  login/             Sign-in / sign-up
  onboarding/        Workspace creation
components/          Feature components; components/ui/ = shared primitives
lib/
  supabase/          server.ts (Server Components/Actions) and client.ts (browser)
  types.ts           Hand-maintained domain types
  validations.ts     Zod schemas for server action input
  workspace.ts       getCurrentWorkspaceAndProfile() — resolves current user's workspace
middleware.ts        Refreshes Supabase auth session cookies
supabase/migrations/ Forward-only SQL migrations — source of truth for schema
```

See [`CLAUDE.md`](./CLAUDE.md) for engineering conventions, security rules, and the frontend/UI governance stack.
