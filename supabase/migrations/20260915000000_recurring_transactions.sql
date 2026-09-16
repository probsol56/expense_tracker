-- Recurring transactions: user-defined schedules (a weekday pattern, a fixed
-- day of month, or every day) that a daily pg_cron job turns into real
-- transaction rows, so fixed costs (commute fare, subscriptions, bills)
-- don't need manual re-entry. A per-workspace holiday list lets a weekday or
-- daily schedule skip specific dates instead of generating that day.

create table public.holidays (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  date date not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, date)
);

create table public.recurring_transactions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  merchant_id uuid references public.merchants(id) on delete set null,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  -- 0=Sunday..6=Saturday (matches Postgres extract(dow from date)); required for 'weekly'
  weekdays smallint[],
  day_of_month smallint check (day_of_month between 1 and 31), -- required for 'monthly'
  skip_holidays boolean not null default true,
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  last_generated_date date,
  created_at timestamptz not null default now(),
  check (frequency <> 'weekly' or (weekdays is not null and array_length(weekdays, 1) > 0)),
  check (frequency <> 'monthly' or day_of_month is not null),
  check (end_date is null or end_date >= start_date)
);

create index recurring_transactions_workspace_id_idx on public.recurring_transactions(workspace_id);
create index recurring_transactions_active_idx on public.recurring_transactions(is_active) where is_active;
create index holidays_workspace_id_idx on public.holidays(workspace_id);

alter table public.recurring_transactions enable row level security;
alter table public.holidays enable row level security;

create policy "workspace recurring transactions access" on public.recurring_transactions
  for all
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id) or user_id = auth.uid())
  with check (user_id = auth.uid() and (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)));

create policy "workspace holidays access" on public.holidays
  for all
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));

-- Whether `p_on_date` matches a rule's schedule, ignoring holidays (checked separately).
create or replace function public.is_recurring_transaction_due(
  p_frequency text,
  p_weekdays smallint[],
  p_day_of_month smallint,
  p_on_date date
)
returns boolean
language sql
stable
as $$
  select case p_frequency
    when 'daily' then true
    when 'weekly' then extract(dow from p_on_date)::smallint = any(p_weekdays)
    when 'monthly' then
      extract(day from p_on_date)::smallint = p_day_of_month
      -- clamp e.g. day_of_month=31 to the actual last day of shorter months
      or (
        p_day_of_month > extract(day from (date_trunc('month', p_on_date) + interval '1 month - 1 day'))::smallint
        and p_on_date = (date_trunc('month', p_on_date) + interval '1 month - 1 day')::date
      )
    else false
  end;
$$;

-- Runs once/day via pg_cron (scheduled below). Evaluates every active rule
-- against today, posts a transaction when due, and stamps last_generated_date
-- either way so a rule is only ever evaluated once per calendar day.
create or replace function public.generate_recurring_transactions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  today date := current_date;
begin
  for rec in
    select *
    from public.recurring_transactions
    where is_active
      and start_date <= today
      and (end_date is null or end_date >= today)
      and (last_generated_date is null or last_generated_date < today)
  loop
    if public.is_recurring_transaction_due(rec.frequency, rec.weekdays, rec.day_of_month, today)
      and not (
        rec.skip_holidays
        and exists (
          select 1 from public.holidays h
          where h.workspace_id = rec.workspace_id and h.date = today
        )
      )
    then
      insert into public.transactions (
        workspace_id, user_id, account_id, category_id, merchant_id,
        amount, date, status, notes
      ) values (
        rec.workspace_id, rec.user_id, rec.account_id, rec.category_id, rec.merchant_id,
        case rec.type when 'income' then rec.amount else -rec.amount end,
        today, 'cleared', rec.description
      );
    end if;

    update public.recurring_transactions set last_generated_date = today where id = rec.id;
  end loop;
end;
$$;

-- Requires pg_cron enabled on the project (Supabase dashboard: Database >
-- Extensions, or this statement if the role has privilege to create it).
create extension if not exists pg_cron;

-- 18:00 UTC = 00:00 Asia/Dhaka. pg_cron always runs in UTC — adjust the hour
-- if your workspace's transactions should post at local midnight elsewhere.
select cron.schedule(
  'generate-recurring-transactions',
  '0 18 * * *',
  $$select public.generate_recurring_transactions();$$
);
