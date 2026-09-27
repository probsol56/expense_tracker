-- The dashboard fetched every transaction, loan and payment to total and
-- filter them in the server. This moves that work into Postgres:
--   * transaction_activity: transactions with their names and a kind, so the
--     activity list can filter and page in the database
--   * dashboard_summary: the summary-card totals as one aggregate row
--   * indexes for the workspace-scoped, date-ordered reads
--
-- Loans and repayments recorded before they posted ledger transactions only
-- reached the activity list through an in-memory merge. They now get a real
-- ledger row (no account, so no balance effect) so the list needs no merge.

do $$
declare
  legacy record;
  v_category_id uuid;
  v_merchant_id uuid;
  v_transaction_id uuid;
begin
  for legacy in
    select l.id, l.workspace_id, l.user_id, l.name, l.lender, l.principal_amount, l.date_started, l.notes
    from loans l
    where l.transaction_id is null
  loop
    insert into categories (workspace_id, type, name)
      values (legacy.workspace_id, 'loan', 'Loan')
      on conflict (workspace_id, type, name) do update set name = excluded.name
      returning id into v_category_id;

    insert into merchants (workspace_id, name)
      values (legacy.workspace_id, trim(legacy.lender))
      on conflict (workspace_id, name) do update set name = excluded.name
      returning id into v_merchant_id;

    insert into transactions (workspace_id, user_id, loan_id, category_id, merchant_id, notes, amount, date, status)
      values (legacy.workspace_id, legacy.user_id, legacy.id, v_category_id, v_merchant_id,
              coalesce(nullif(legacy.notes, ''), 'Loan disbursement from ' || trim(legacy.lender)),
              legacy.principal_amount, legacy.date_started, 'cleared')
      returning id into v_transaction_id;

    update loans set transaction_id = v_transaction_id where id = legacy.id;
  end loop;

  for legacy in
    select p.id, p.workspace_id, p.user_id, p.loan_id, p.amount, p.date, p.notes, l.name as loan_name, l.lender
    from loan_payments p
    join loans l on l.id = p.loan_id
    where p.transaction_id is null
  loop
    insert into categories (workspace_id, type, name)
      values (legacy.workspace_id, 'loan', 'Loan')
      on conflict (workspace_id, type, name) do update set name = excluded.name
      returning id into v_category_id;

    insert into merchants (workspace_id, name)
      values (legacy.workspace_id, trim(legacy.lender))
      on conflict (workspace_id, name) do update set name = excluded.name
      returning id into v_merchant_id;

    insert into transactions (workspace_id, user_id, loan_id, category_id, merchant_id, notes, amount, date, status)
      values (legacy.workspace_id, legacy.user_id, legacy.loan_id, v_category_id, v_merchant_id,
              coalesce(nullif(legacy.notes, ''), 'Repayment: ' || legacy.loan_name),
              -legacy.amount, legacy.date, 'cleared')
      returning id into v_transaction_id;

    update loan_payments set transaction_id = v_transaction_id where id = legacy.id;
  end loop;
end;
$$;

create index if not exists transactions_workspace_date_idx
  on public.transactions (workspace_id, date desc, created_at desc);
create index if not exists transactions_workspace_account_idx
  on public.transactions (workspace_id, account_id);
create index if not exists accounts_workspace_id_idx
  on public.accounts (workspace_id);

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
  end as kind
from public.transactions t
left join public.merchants m on m.id = t.merchant_id
left join public.categories c on c.id = t.category_id;

revoke all on public.transaction_activity from public, anon;
grant select on public.transaction_activity to authenticated;

create or replace function public.dashboard_summary(
  p_workspace_id uuid,
  p_from date,
  p_to date
) returns table (
  month_spending numeric,
  month_income numeric,
  month_expense_count bigint,
  accounts_balance numeric,
  account_count bigint,
  outstanding_loan_balance numeric,
  loan_paid numeric,
  active_loan_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select -sum(a.amount) from transaction_activity a
              where a.workspace_id = p_workspace_id and a.date >= p_from and a.date < p_to
                and a.kind = 'expense'), 0),
    coalesce((select sum(a.amount) from transaction_activity a
              where a.workspace_id = p_workspace_id and a.date >= p_from and a.date < p_to
                and a.kind = 'income'), 0),
    (select count(*) from transaction_activity a
     where a.workspace_id = p_workspace_id and a.date >= p_from and a.date < p_to
       and a.kind = 'expense'),
    coalesce((select sum(balance) from accounts where workspace_id = p_workspace_id), 0),
    (select count(*) from accounts where workspace_id = p_workspace_id),
    coalesce((select sum(outstanding_balance) from loans where workspace_id = p_workspace_id), 0),
    coalesce((select sum(amount) from loan_payments where workspace_id = p_workspace_id), 0),
    (select count(*) from loans where workspace_id = p_workspace_id and status = 'active');
$$;

revoke execute on function public.dashboard_summary(uuid, date, date) from public, anon;
grant execute on function public.dashboard_summary(uuid, date, date) to authenticated;
