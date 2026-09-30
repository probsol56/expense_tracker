# Wallo

Multi-workspace expense, income, and loan tracker. Next.js App Router + Supabase (Postgres, RLS, `@supabase/ssr`) as a single deployable app — no separate backend service.

Every workspace is `personal`, `household`, or `business`, with its own base currency, owner, and optional members. Transactions, accounts, categories, merchants, and loans are all scoped to the current workspace via RLS.

## Getting started

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Create a Supabase project, fill in `.env.local` (see [Environment variables](#environment-variables)), then apply the migrations as described in [Applying migrations](#applying-migrations).

## Scripts

```
pnpm dev        # local development
pnpm typecheck  # strict TypeScript validation
pnpm lint       # ESLint
pnpm test       # Vitest unit tests
pnpm build      # production build
```

Database tests (RLS isolation, ledger RPCs, summaries, account deletion) are pgTAP files in `supabase/tests/`, run with `supabase test db` against a local stack (`supabase db start`). CI runs both suites on every PR.

## Environment variables

Parsed once in `lib/config.ts`; the app refuses to start on a missing or invalid value. Only `NEXT_PUBLIC_*` values are exposed to the browser and are **inlined at build time**, so on Docker/CI hosts they must be provided as build arguments, not only as runtime env.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | The public (anon / publishable) key. Never put a `service_role` or secret key anywhere in this app |
| `NEXT_PUBLIC_SITE_URL` | in production | Public origin, used for auth email links and redirects |
| `NEXT_PUBLIC_SENTRY_DSN` | no | Enables error reporting in production (region-specific ingest host is added to the CSP automatically) |

## Applying migrations

`supabase/migrations/` is the source of truth for the schema, applied in filename order and forward-only. Don't paste SQL into the dashboard editor; that skips the migration history and lets environments drift.

### One-time setup

```bash
supabase login
supabase link --project-ref <project-ref>   # asks for the database password; don't save it in a file
```

The database password is a secret. Type it at the prompt or export `SUPABASE_DB_PASSWORD` in your shell for the session; never commit it.

### If the production database predates the CLI (baseline once)

Migrations that were pasted into the SQL editor aren't recorded in Supabase's migration history, so `db push` would try to re-run all of them. Check first:

```bash
supabase migration list
```

For every migration that is already applied in production but shows no **Remote** entry, mark it as applied without running it:

```bash
supabase migration repair --status applied <version> [<version> ...]
```

Use the timestamp prefix of the filename (e.g. `20261002000000`). Only mark versions you have verified are in the database. Afterwards `supabase migration list` should show Local and Remote in step.

### Every release

1. Merge the PR once CI is green (CI runs the pgTAP suite against every migration).
2. Preview what will run:
   ```bash
   supabase db push --dry-run
   ```
3. Apply:
   ```bash
   supabase db push
   ```
4. Deploy the app. Deploy order matters: migrations first, then the app, because new pages call new RPCs/views (e.g. `/loans` and `/recurring` error until `20261001000000_list_summaries.sql` exists).

Migrations are not rolled back. To undo a change, ship a new migration that reverses it. For data loss, restore from backup (see below).

### pg_cron

`20260915000000_recurring_transactions.sql` schedules the daily recurring-transaction job with `pg_cron`. Enable the extension first: Supabase dashboard → Database → Extensions → `pg_cron`. It runs in UTC; the job is set to 18:00 UTC (midnight Asia/Dhaka). Check that it is registered with `select jobname, schedule from cron.job;`.

### Backups

Confirm the project's plan includes daily backups, and turn on Point-in-Time Recovery if you need to restore to a specific moment (Supabase dashboard → Database → Backups). Take a manual backup or check the latest automatic one before a risky migration.

## Auth setup (Supabase dashboard)

- **URL Configuration:** Site URL = your production origin; add `<origin>/auth/callback` to Redirect URLs.
- **Email:** enable *Confirm email* and *Secure password change*; minimum password length 8 (matches `PASSWORD_MIN_LENGTH`).
- **SMTP:** configure a custom SMTP provider; the built-in sender is limited to a handful of emails per hour.
- **Rate limits:** cap emails sent per hour; leave sign-in/token limits at their defaults.
- Reset and confirmation links only work in the browser that requested them (PKCE).

## Features

| Route | Status |
|---|---|
| `/login` | Email/password sign-in and sign-up with email confirmation |
| `/forgot-password`, `/reset-password` | Emailed password reset link, then a new password |
| `/onboarding` | Create a workspace (type + base currency) for a new user |
| `/` (dashboard) | Totals from a SQL summary function plus a paged recent-activity list |
| `/transactions` | Server-paginated, filterable list; create/update/delete via Server Actions and RPCs |
| `/accounts` | Accounts and transfers; balance is a DB-trigger-derived running total |
| `/categories`, `/merchants` | Workspace-scoped create + list, resolved-or-created by name |
| `/loans` | Loans and repayments posting real ledger transactions; totals from SQL |
| `/recurring` | Recurring rules and holidays, generated daily by pg_cron |
| `/settings` | Profile name, workspace name/currency, and account deletion |
| `/import` | CSV upload (`date,merchant,amount`, optional `category`) into staging tables with dedupe on `external_id` |

Middleware refreshes Supabase auth session cookies on every request.

## Known limitations

- **CSV import doesn't post to the main ledger.** Rows land in `bank_transactions`/`import_batches` staging tables, not `transactions`, and the form requires pasting workspace/bank-account UUIDs manually.
- **No workspace switcher or invites.** A user's "current" workspace is the one they own, or their first membership. Account deletion is refused while a workspace is shared with other people.
- **No edit/delete UI for categories or merchants** once created.
- **No CAPTCHA on auth forms** (planned). Don't enable CAPTCHA in the Supabase dashboard until the forms send a token, or sign-in will break.
- **No generated DB types.** `lib/types.ts` is hand-maintained; switch to `supabase gen types typescript` if the schema outgrows it.

## Repository map

```
app/
  (app)/            Authenticated shell — dashboard, transactions, accounts,
                     categories, merchants, loans, recurring, settings, import —
                     each with its own page.tsx and, where it mutates data, actions.ts
  actions.ts         Root server actions (transaction create/update/delete)
  auth/callback/     Exchanges emailed auth codes for a session
  login/ forgot-password/ reset-password/ onboarding/
components/          Feature components; components/ui/ = shared primitives
lib/
  supabase/          server.ts (Server Components/Actions) and client.ts (browser)
  config.ts          Zod-parsed, frozen environment config
  pagination.ts      Bounded, range-based paging helpers
  validations.ts     Zod schemas for server action input
  errors.ts          Maps database errors to safe messages and reports them
  workspace.ts       getCurrentWorkspaceAndProfile() — resolves current user's workspace
middleware.ts        Refreshes Supabase auth session cookies
instrumentation*.ts  Sentry initialisation (server/edge/browser)
supabase/migrations/ Forward-only SQL migrations — source of truth for schema
supabase/tests/      pgTAP tests (RLS isolation, RPCs, summaries)
```

See [`CLAUDE.md`](./CLAUDE.md) for engineering conventions, security rules, and the frontend/UI governance stack.
