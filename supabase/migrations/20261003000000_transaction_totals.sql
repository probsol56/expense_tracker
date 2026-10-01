-- Reports pages the ledger, so the "total" can't be summed in JS over the
-- loaded rows. Sums the whole filtered range in SQL with the same sign rule
-- as the page total: positive amounts are money in, the rest money out.
-- security invoker: RLS on transactions still applies.
create or replace function public.transaction_totals(
  p_workspace_id uuid,
  p_account_id uuid default null,
  p_from date default null,
  p_to date default null
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
    coalesce(sum(-amount) filter (where amount <= 0), 0),
    coalesce(sum(amount) filter (where amount > 0), 0)
  from transactions
  where workspace_id = p_workspace_id
    and (p_account_id is null or account_id = p_account_id)
    and (p_from is null or date >= p_from)
    and (p_to is null or date <= p_to);
$$;

revoke execute on function public.transaction_totals(uuid, uuid, date, date) from public, anon;
grant execute on function public.transaction_totals(uuid, uuid, date, date) to authenticated;
