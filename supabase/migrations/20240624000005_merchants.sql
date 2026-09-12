create table if not exists public.merchants (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

alter table public.merchants enable row level security;
create policy "workspace merchants access" on public.merchants for all using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)) with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));

-- Backfill merchants from existing manual transactions
insert into public.merchants (workspace_id, name)
select distinct workspace_id, merchant
from public.transactions
where workspace_id is not null
on conflict do nothing;

-- Backfill merchants from imported bank transactions
insert into public.merchants (workspace_id, name)
select distinct workspace_id, merchant
from public.bank_transactions
where workspace_id is not null
on conflict do nothing;