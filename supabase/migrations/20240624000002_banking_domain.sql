create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text not null default '#1d8b70',
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);
create table if not exists public.bank_accounts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  institution text,
  account_type text not null default 'checking' check (account_type in ('checking','savings','credit_card','cash','investment','loan')),
  last_four text check (last_four is null or last_four ~ '^[0-9]{4}$'),
  current_balance numeric(14,2) not null default 0,
  currency char(3) not null default 'USD',
  created_at timestamptz not null default now()
);
create table if not exists public.bank_transactions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bank_account_id uuid not null references public.bank_accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  external_id text,
  merchant text not null,
  amount numeric(14,2) not null,
  transaction_date date not null,
  pending boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (bank_account_id, external_id)
);
create table if not exists public.import_batches (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  imported_by uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'completed' check (status in ('completed','partial','failed')),
  error_summary text,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.import_batches enable row level security;
create policy "workspace categories access" on public.categories for all using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)) with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "workspace bank accounts access" on public.bank_accounts for all using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)) with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "workspace bank transactions access" on public.bank_transactions for all using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)) with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "workspace import audit access" on public.import_batches for select using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "workspace import audit insert" on public.import_batches for insert with check (imported_by = auth.uid() and (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)));
