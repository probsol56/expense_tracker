begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'B', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'A1', 100),
  ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'B1', 5000);

insert into public.categories (id, workspace_id, type, name) values
  ('aaaaaaaa-3333-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'Food'),
  ('aaaaaaaa-3333-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'income', 'Salary'),
  ('aaaaaaaa-3333-0000-0000-000000000003', 'aaaaaaaa-1111-0000-0000-000000000001', 'loan', 'Loan'),
  ('aaaaaaaa-3333-0000-0000-000000000004', 'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'Transfer');

insert into public.transactions (workspace_id, user_id, account_id, category_id, amount, date) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', -40, '2026-09-05'),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', -10, '2026-09-06'),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000002', 500, '2026-09-07'),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000003', 1000, '2026-09-08'),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000004', -70, '2026-09-09'),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', -999, '2026-08-20');

insert into public.loans (
  id, workspace_id, user_id, name, lender, principal_amount, outstanding_balance, status, transaction_id
) values (
  'aaaaaaaa-5555-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Personal loan', 'Lender', 1000, 1000, 'active',
  (
    select id from public.transactions
    where workspace_id = 'aaaaaaaa-1111-0000-0000-000000000001'
      and category_id = 'aaaaaaaa-3333-0000-0000-000000000003'
      and amount = 1000 and date = '2026-09-08'
  )
);

insert into public.transactions (workspace_id, user_id, account_id, category_id, amount, date)
values (
  'aaaaaaaa-1111-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-2222-0000-0000-000000000001',
  'aaaaaaaa-3333-0000-0000-000000000003',
  -20,
  '2026-09-10'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select month_spending from public.dashboard_summary('aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01')),
  70.00::numeric, 'spending includes an ordinary expense categorized as loan and skips transfers and other months');
select is(
  (select month_income from public.dashboard_summary('aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01')),
  500.00::numeric, 'income skips the loan disbursement');
select is(
  (select month_expense_count from public.dashboard_summary('aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01')),
  3::bigint, 'expense count includes an ordinary transaction categorized as loan');
select is(
  (select accounts_balance from public.dashboard_summary('aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01')),
  (100 - 40 - 10 + 500 + 1000 - 70 - 999 - 20)::numeric, 'accounts_balance sums only this workspace');

select is(
  (select array_agg(kind order by date) from public.transaction_activity
    where workspace_id = 'aaaaaaaa-1111-0000-0000-000000000001' and date >= '2026-09-01'),
  array['expense', 'expense', 'income', 'loan', 'transfer', 'expense'],
  'only loan-page disbursements are classified as loans');

select is(
  (select money_out from public.transaction_totals(
    'aaaaaaaa-1111-0000-0000-000000000001', null, '2026-09-01', '2026-10-01'
  )),
  140.00::numeric, 'transaction totals exclude loans but include transactions categorized as loan');

select is(
  (select count(*)::int from public.transaction_activity
    where workspace_id = 'bbbbbbbb-1111-0000-0000-000000000001'),
  0, 'user A sees none of B''s activity');
select is(
  (select accounts_balance from public.dashboard_summary('bbbbbbbb-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01')),
  0::numeric, 'user A gets an empty summary for B''s workspace');

select is(
  (select outstanding_loan_balance from public.dashboard_summary('aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01')),
  0::numeric, 'an empty loan table sums to zero rather than null');

set local role anon;
select throws_ok(
  $$select * from public.dashboard_summary('aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01')$$,
  '42501', null, 'anon cannot execute dashboard_summary');

select * from finish();
rollback;
