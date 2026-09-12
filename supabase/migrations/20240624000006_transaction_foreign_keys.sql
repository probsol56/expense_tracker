alter table public.transactions
  add column if not exists category_id uuid,
  add column if not exists merchant_id uuid;

insert into public.categories (workspace_id, name, type)
select distinct t.workspace_id, t.category, 'expense'
from public.transactions t
where t.workspace_id is not null
  and t.category is not null
  and not exists (
    select 1
    from public.categories c
    where c.workspace_id = t.workspace_id
      and c.type = 'expense'
      and c.name = t.category
  )
on conflict (workspace_id, type, name) do nothing;

insert into public.merchants (workspace_id, name)
select distinct t.workspace_id, t.merchant
from public.transactions t
where t.workspace_id is not null
  and t.merchant is not null
  and not exists (
    select 1
    from public.merchants m
    where m.workspace_id = t.workspace_id
      and m.name = t.merchant
  )
on conflict (workspace_id, name) do nothing;

update public.transactions t
set category_id = c.id
from public.categories c
where t.category_id is null
  and t.workspace_id is not null
  and t.category is not null
  and c.workspace_id = t.workspace_id
  and c.type = 'expense'
  and c.name = t.category;

update public.transactions t
set merchant_id = m.id
from public.merchants m
where t.merchant_id is null
  and t.workspace_id is not null
  and t.merchant is not null
  and m.workspace_id = t.workspace_id
  and m.name = t.merchant;

create index if not exists transactions_category_id_idx
  on public.transactions (category_id);

create index if not exists transactions_merchant_id_idx
  on public.transactions (merchant_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_category_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_category_id_fkey
      foreign key (category_id) references public.categories(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_merchant_id_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_merchant_id_fkey
      foreign key (merchant_id) references public.merchants(id) on delete set null;
  end if;
end $$;

alter table public.transactions
  drop column if exists merchant,
  drop column if exists category;
