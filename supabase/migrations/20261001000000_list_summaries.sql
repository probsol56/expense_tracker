-- The loans and recurring pages are now paged, so their header totals can't
-- be summed in JS over the loaded rows any more. These compute them in SQL.
-- All are security invoker: RLS on the underlying tables still applies.

-- Loans with an exact repaid total. The correlated subquery is evaluated only
-- for the rows a page actually returns (served by loan_payments_loan_id_idx).
-- Deliberately not derived as principal - outstanding: loans written by the
-- pre-RPC JS read-modify-write may have drifted.
create or replace view public.loan_overview
with (security_invoker = true) as
select
  l.id,
  l.workspace_id,
  l.user_id,
  l.name,
  l.lender,
  l.principal_amount,
  l.outstanding_balance,
  l.status,
  l.date_started,
  l.notes,
  l.created_at,
  l.transaction_id,
  coalesce((select sum(p.amount) from public.loan_payments p where p.loan_id = l.id), 0) as total_paid
from public.loans l;

revoke all on public.loan_overview from public, anon;
grant select on public.loan_overview to authenticated;

create or replace function public.loan_summary(p_workspace_id uuid)
returns table (
  total_borrowed numeric,
  total_repaid numeric,
  total_outstanding numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select sum(principal_amount) from loans where workspace_id = p_workspace_id), 0),
    coalesce((select sum(amount) from loan_payments where workspace_id = p_workspace_id), 0),
    coalesce((select sum(outstanding_balance) from loans where workspace_id = p_workspace_id), 0);
$$;

revoke execute on function public.loan_summary(uuid) from public, anon;
grant execute on function public.loan_summary(uuid) to authenticated;

-- Same estimate the recurring page used to compute in JS: a month is 30 days
-- or 4.345 weeks; monthly rules post once.
create or replace function public.recurring_summary(p_workspace_id uuid)
returns table (
  active_count bigint,
  monthly_expense numeric,
  monthly_income numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with active as (
    select
      type,
      amount * case frequency
        when 'daily' then 30
        when 'weekly' then coalesce(cardinality(weekdays), 0) * 4.345
        else 1
      end as monthly_amount
    from recurring_transactions
    where workspace_id = p_workspace_id and is_active
  )
  select
    (select count(*) from active),
    coalesce((select sum(monthly_amount) from active where type = 'expense'), 0),
    coalesce((select sum(monthly_amount) from active where type = 'income'), 0);
$$;

revoke execute on function public.recurring_summary(uuid) from public, anon;
grant execute on function public.recurring_summary(uuid) to authenticated;
