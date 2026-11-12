create or replace view public.transaction_activity
with (security_invoker = true) as
select
  t.id,
  t.workspace_id,
  t.merchant_id,
  t.category_id,
  t.account_id,
  t.notes,
  t.amount,
  t.date,
  t.status,
  t.created_at,
  m.name as merchant_name,
  c.name as category_name,
  case
    when exists (select 1 from public.loans l where l.transaction_id = t.id)
      or exists (select 1 from public.loan_payments p where p.transaction_id = t.id) then 'loan'
    when lower(trim(coalesce(c.name, ''))) = 'transfer' then 'transfer'
    when t.amount < 0 then 'expense'
    else 'income'
  end as kind,
  t.loan_id
from public.transactions t
left join public.merchants m on m.id = t.merchant_id
left join public.categories c on c.id = t.category_id;

create or replace function public.transaction_totals(
  p_workspace_id uuid,
  p_account_id uuid default null,
  p_from date default null,
  p_to date default null,
  p_category text default null
)
returns table (
  money_out numeric,
  money_in numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(-t.amount) filter (where t.amount <= 0), 0),
    coalesce(sum(t.amount) filter (where t.amount > 0), 0)
  from public.transactions t
  where t.workspace_id = p_workspace_id
    and (p_account_id is null or t.account_id = p_account_id)
    and (p_from is null or t.date >= p_from)
    and (p_to is null or t.date <= p_to)
    and (
      p_category is null
      or exists (
        select 1
        from public.categories c
        where c.id = t.category_id
          and c.name = p_category
      )
    )
    and not exists (select 1 from public.loans l where l.transaction_id = t.id)
    and not exists (select 1 from public.loan_payments p where p.transaction_id = t.id);
$$;
