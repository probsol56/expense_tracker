drop function public.transaction_totals(uuid, uuid, date, date);

create function public.transaction_totals(
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
  from transactions as t
  where t.workspace_id = p_workspace_id
    and (p_account_id is null or t.account_id = p_account_id)
    and (p_from is null or t.date >= p_from)
    and (p_to is null or t.date <= p_to)
    and (
      p_category is null
      or exists (
        select 1
        from categories as c
        where c.id = t.category_id
          and c.name = p_category
      )
    );
$$;

revoke execute on function public.transaction_totals(uuid, uuid, date, date, text) from public, anon;
grant execute on function public.transaction_totals(uuid, uuid, date, date, text) to authenticated;