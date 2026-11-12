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
    when lower(coalesce(c.name, '')) like '%loan%' or lower(coalesce(c.name, '')) like '%mortgage%' then 'loan'
    when lower(trim(coalesce(c.name, ''))) = 'transfer' then 'transfer'
    when t.amount < 0 then 'expense'
    else 'income'
  end as kind,
  t.loan_id
from public.transactions t
left join public.merchants m on m.id = t.merchant_id
left join public.categories c on c.id = t.category_id;
