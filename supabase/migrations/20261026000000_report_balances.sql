create or replace function public.transaction_opening_balance(
  p_workspace_id uuid,
  p_account_id uuid default null,
  p_before date default null
)
returns table (opening_balance numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((
      select sum(a.starting_balance)
      from public.accounts as a
      where a.workspace_id = p_workspace_id
        and (p_account_id is null or a.id = p_account_id)
    ), 0)
    + coalesce((
      select sum(t.amount)
      from public.transactions as t
      where t.workspace_id = p_workspace_id
        and (p_account_id is null or t.account_id = p_account_id)
        and (p_before is null or t.date < p_before)
    ), 0) as opening_balance;
$$;

create or replace function public.transaction_running_balances(
  p_workspace_id uuid,
  p_account_id uuid,
  p_transaction_ids uuid[]
)
returns table (transaction_id uuid, running_balance numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    current_entry.id as transaction_id,
    opening.opening_balance + coalesce((
      select sum(prior_entry.amount)
      from public.transactions as prior_entry
      where prior_entry.workspace_id = p_workspace_id
        and (p_account_id is null or prior_entry.account_id = p_account_id)
        and (prior_entry.date, prior_entry.created_at, prior_entry.id)
          <= (current_entry.date, current_entry.created_at, current_entry.id)
    ), 0) as running_balance
  from public.transactions as current_entry
  cross join lateral public.transaction_opening_balance(
    p_workspace_id, p_account_id, null
  ) as opening
  where current_entry.workspace_id = p_workspace_id
    and (p_account_id is null or current_entry.account_id = p_account_id)
    and current_entry.id = any(p_transaction_ids);
$$;

revoke execute on function public.transaction_opening_balance(uuid, uuid, date) from public, anon;
revoke execute on function public.transaction_running_balances(uuid, uuid, uuid[]) from public, anon;
grant execute on function public.transaction_opening_balance(uuid, uuid, date) to authenticated;
grant execute on function public.transaction_running_balances(uuid, uuid, uuid[]) to authenticated;
