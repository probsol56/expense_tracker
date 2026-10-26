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
    starting.starting_balance + coalesce((
      select sum(prior_entry.amount)
      from public.transactions as prior_entry
      where prior_entry.workspace_id = p_workspace_id
        and (p_account_id is null or prior_entry.account_id = p_account_id)
        and (prior_entry.date, prior_entry.created_at, prior_entry.id)
          <= (current_entry.date, current_entry.created_at, current_entry.id)
    ), 0) as running_balance
  from public.transactions as current_entry
  cross join lateral (
    select coalesce(sum(a.starting_balance), 0) as starting_balance
    from public.accounts as a
    where a.workspace_id = p_workspace_id
      and (p_account_id is null or a.id = p_account_id)
  ) as starting
  where current_entry.workspace_id = p_workspace_id
    and (p_account_id is null or current_entry.account_id = p_account_id)
    and current_entry.id = any(p_transaction_ids);
$$;

revoke execute on function public.transaction_running_balances(uuid, uuid, uuid[]) from public, anon;
grant execute on function public.transaction_running_balances(uuid, uuid, uuid[]) to authenticated;
