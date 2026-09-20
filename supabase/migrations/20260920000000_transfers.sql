-- Account-to-account transfers (e.g. cash withdrawal from a bank account).
-- Posts two real, linked transactions instead of forcing a manual
-- expense+income workaround that double-counts in reports.

alter table public.categories drop constraint if exists categories_type_check;

alter table public.categories add constraint categories_type_check check (type in ('expense', 'income', 'loan', 'transfer')) not valid;

alter table public.categories validate constraint categories_type_check;

create table public.transfers (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id) on delete restrict,
  to_account_id uuid not null references public.accounts(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  date date not null default current_date,
  notes text,
  from_transaction_id uuid references public.transactions(id) on delete set null,
  to_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint transfers_accounts_differ check (from_account_id <> to_account_id)
);

create index transfers_workspace_id_idx on public.transfers(workspace_id);

alter table public.transfers enable row level security;

create policy "user transfers" on public.transfers for all
  using (user_id = auth.uid() or exists (
    select 1 from public.workspace_members m
    where m.workspace_id = workspace_id and m.user_id = auth.uid()
  ));
