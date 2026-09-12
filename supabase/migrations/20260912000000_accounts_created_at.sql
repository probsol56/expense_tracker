-- accounts was the only table missing created_at, which every page listing
-- accounts orders by — that order clause was silently failing and pages
-- were rendering empty account lists.
alter table public.accounts
  add column if not exists created_at timestamptz not null default now();
