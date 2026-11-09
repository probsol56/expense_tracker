create or replace function public.account_monthly_history(
  p_workspace_id uuid,
  p_from date,
  p_to date
)
returns table (
  account_id uuid,
  opening_balance numeric,
  income_amount numeric,
  closing_balance numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    a.id as account_id,
    a.starting_balance + coalesce(
      sum(activity.amount) filter (where activity.date < p_from),
      0
    ) as opening_balance,
    coalesce(
      sum(activity.amount) filter (
        where activity.date >= p_from
          and activity.date < p_to
          and activity.kind = 'income'
      ),
      0
    ) as income_amount,
    a.starting_balance + coalesce(sum(activity.amount), 0) as closing_balance
  from public.accounts a
  left join public.transaction_activity activity
    on activity.account_id = a.id
    and activity.workspace_id = p_workspace_id
    and activity.date < p_to
  where a.workspace_id = p_workspace_id
  group by a.id, a.starting_balance, a.created_at
  order by a.created_at desc, a.id;
$$;

revoke execute on function public.account_monthly_history(uuid, date, date) from public, anon;
grant execute on function public.account_monthly_history(uuid, date, date) to authenticated;
