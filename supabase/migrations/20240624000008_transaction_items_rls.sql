-- transaction_items was originally created by hand; this makes fresh databases
-- (CI, local) reproducible. No-op where the table already exists.
create table if not exists public.transaction_items (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  name text not null,
  quantity numeric(12,3) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists transaction_items_transaction_id_idx
  on public.transaction_items(transaction_id);

alter table public.transaction_items enable row level security;

drop policy if exists "workspace transaction items access" on public.transaction_items;

create policy "workspace transaction items access"
  on public.transaction_items
  for all
  using (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_items.transaction_id
        and (
          t.user_id = auth.uid()
          or public.is_workspace_member(t.workspace_id)
          or public.is_workspace_owner(t.workspace_id)
        )
    )
  )
  with check (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_items.transaction_id
        and (
          t.user_id = auth.uid()
          or public.is_workspace_member(t.workspace_id)
          or public.is_workspace_owner(t.workspace_id)
        )
    )
  );
