create or replace function public.loan_lender_summary(p_workspace_id uuid)
returns table (
  lender text,
  loan_count bigint,
  total_borrowed numeric,
  total_repaid numeric,
  total_outstanding numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with workspace_loans as (
    select
      l.id,
      lower(btrim(l.lender)) as lender_key,
      btrim(l.lender) as lender_name,
      l.principal_amount,
      l.outstanding_balance
    from public.loans l
    where l.workspace_id = p_workspace_id
  ),
  repayment_totals as (
    select p.loan_id, sum(p.amount) as total_repaid
    from public.loan_payments p
    join workspace_loans l on l.id = p.loan_id
    group by p.loan_id
  )
  select
    coalesce(nullif(min(l.lender_name), ''), 'Unspecified lender'),
    count(*) as loan_count,
    sum(l.principal_amount) as total_borrowed,
    coalesce(sum(r.total_repaid), 0) as total_repaid,
    sum(l.outstanding_balance) as total_outstanding
  from workspace_loans l
  left join repayment_totals r on r.loan_id = l.id
  group by l.lender_key
  order by sum(l.outstanding_balance) desc, min(l.lender_name);
$$;

revoke execute on function public.loan_lender_summary(uuid) from public, anon;
grant execute on function public.loan_lender_summary(uuid) to authenticated;
