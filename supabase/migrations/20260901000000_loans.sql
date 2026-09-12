create table if not exists public.loans (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  lender text not null,
  principal_amount numeric(12,2) not null check (principal_amount > 0),
  outstanding_balance numeric(12,2) not null check (outstanding_balance >= 0),
  status text not null default 'active' check (status in ('active', 'paid', 'closed')),
  date_started date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.loan_payments (
  id uuid primary key default uuid_generate_v4(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists loan_id uuid references public.loans(id) on delete set null;

alter table public.loans enable row level security;
alter table public.loan_payments enable row level security;

create policy "workspace loans access" on public.loans
  for all
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id) or user_id = auth.uid())
  with check (user_id = auth.uid() and (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)));

create policy "workspace loan payments access" on public.loan_payments
  for all
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id) or user_id = auth.uid())
  with check (user_id = auth.uid() and (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)));

create index if not exists loans_workspace_id_idx on public.loans(workspace_id);
create index if not exists loan_payments_loan_id_idx on public.loan_payments(loan_id);
create index if not exists loan_payments_workspace_id_idx on public.loan_payments(workspace_id);
