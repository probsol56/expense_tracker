# Wallo — Expense Tracker

Multi-workspace (personal/household/business) expense & loan tracker. Next.js App Router + Supabase, single deployable app — no separate backend service.

## Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript (strict)
- **Database/Auth:** Supabase (PostgreSQL, `@supabase/ssr`) — RLS is the security boundary
- **Styling:** Tailwind CSS + Radix UI primitives (`components/ui`)
- **Validation:** Zod
- **Package manager:** pnpm only

No state library is installed (no Redux/Zustand/TanStack Query) — data flows through Server Components + Server Actions, with plain `useState`/local hooks (`lib/hooks.ts`) for client-side UI state.

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
  types.ts           Hand-maintained domain types (no generated DB types yet)
  validations.ts     Zod schemas for server action input
  workspace.ts        getCurrentWorkspaceAndProfile() — resolves current user's workspace
middleware.ts        Refreshes Supabase auth session cookies
supabase/migrations/ Forward-only SQL migrations — source of truth for schema
```

## Domain model

- Everything is scoped to a **workspace** (`personal` | `household` | `business`), owned by one user, with optional `workspace_members`.
- A **transaction** is `expense` | `income` | `loan`, belongs to a workspace + category + merchant, optionally has `transaction_items` (line items) and links to a `loan`.
- Loans track `principal_amount` / `outstanding_balance` with their own payments table.
- RLS enforces workspace/owner scoping at the DB level — never bypass it with a service-role client in app code.

## Commands

```
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

No test script exists yet — don't assume `pnpm test` works.

## Patterns already in place (follow, don't reinvent)

- **Server Components fetch data** via `lib/supabase/server.ts`. The browser client (`lib/supabase/client.ts`) is only for interactive/client-side needs.
- **Mutations are Server Actions**, colocated as `actions.ts` next to the route that uses them, returning `{ error: string }` or `{ success: true }` and calling `revalidatePath` on the affected routes.
- Every server action **re-validates input with Zod** (`lib/validations.ts`) and **re-checks ownership** (`user_id`/`workspace_id`) before mutating — never trust client-supplied IDs.
- Categories and merchants are **resolved-or-created by name** per workspace (see `resolveCategoryId`/`resolveMerchantId` in `app/actions.ts`) rather than requiring the UI to manage foreign keys directly.
- No generated DB types currently — `lib/types.ts` is hand-maintained. If the schema outgrows this, switch to `supabase gen types typescript` rather than expanding it further by hand.

## Frontend & UI governance

Layered rule files, usability wins on conflict:
1. [`uiux-principles.md`](./.claude/ui/uiux-principles.md) — usability, accessibility, layout, component states
2. [`frontend-rules.md`](./.claude/frontend/frontend-rules.md) — architecture, state, clean code
3. [`frontend-design.md`](./.claude/ui/frontend-design.md) — visual direction, typography


## Non-negotiable rules

1. **Never commit secrets.** `.env` is gitignored; `.env.example` is committed with keys only, no values.
2. **No `any`, no `!` assertions.** Zod at every external boundary (form data, Supabase rows treated as untyped).
3. **Server Actions are the only write path.** Re-validate auth and row ownership server-side on every mutation — see `.claude/rules/security.md`.

## Workflow

- Conventional Commits, imperative mood, small focused changes — see `.claude/rules/git.md`.
- This directory is not yet a git repository — initialize before assuming branch/PR workflow applies.
- Schema changes ship as new files in `supabase/migrations/`, applied in filename order. No manual dashboard edits.
