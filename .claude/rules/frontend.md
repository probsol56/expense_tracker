---
paths:
  - "app/**"
  - "components/**"
  - "lib/**"
---

# Frontend — project rules (this repo only)

Generic standards live in the portable stack — read before writing any component:

1. `.claude/ui/uiux-principles.md` — usability (wins all conflicts)
2. `.claude/frontend/frontend-rules.md` — architecture, state, clean code
3. `.claude/ui/frontend-design.md` — aesthetics


- **State homes:** TanStack Query for all server state; Zustand only for local UI state — never mix. No Redux, no Context for server state.
- **Supabase session lives in httpOnly cookies** (see `supabase.md`). Never in `localStorage`.
- **Fetch in Server Components** via the server-side Supabase client; the browser client is for realtime/interactive cases only.
