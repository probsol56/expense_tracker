create or replace function public.dashboard_category_spending(
  p_workspace_id uuid,
  p_from date,
  p_to date
)
returns table (
  category_id uuid,
  category_name text,
  amount numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    a.category_id,
    coalesce(a.category_name, 'Uncategorized'),
    sum(-a.amount)
  from public.transaction_activity a
  where a.workspace_id = p_workspace_id
    and a.date >= p_from
    and a.date < p_to
    and a.kind = 'expense'
  group by a.category_id, a.category_name
  order by sum(-a.amount) desc, coalesce(a.category_name, 'Uncategorized') asc;
$$;

revoke execute on function public.dashboard_category_spending(uuid, date, date) from public, anon;
grant execute on function public.dashboard_category_spending(uuid, date, date) to authenticated;
