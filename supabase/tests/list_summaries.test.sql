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
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'A1', 0),
  ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'B1', 0);

-- Loan 1 has drifted (outstanding says 900 but 300 was repaid), which is why
-- loan_overview sums payments instead of trusting principal - outstanding.
insert into public.loans (id, workspace_id, user_id, name, lender, principal_amount, outstanding_balance, status) values
  ('aaaaaaaa-4444-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Car', 'Bank', 1000, 900, 'active'),
  ('aaaaaaaa-4444-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Family', 'Mum', 500, 500, 'active'),
  ('bbbbbbbb-4444-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'B loan', 'Bank', 9999, 9999, 'active');

insert into public.loan_payments (loan_id, workspace_id, user_id, amount, date) values
  ('aaaaaaaa-4444-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 100, '2026-09-01'),
  ('aaaaaaaa-4444-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 200, '2026-09-15');

insert into public.recurring_transactions (workspace_id, user_id, account_id, type, amount, frequency, weekdays, day_of_month, is_active) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'expense', 10, 'daily', null, null, true),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'expense', 100, 'weekly', '{1,3}', null, true),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'income', 5000, 'monthly', null, 1, true),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'expense', 777, 'monthly', null, 1, false),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-2222-0000-0000-000000000001', 'expense', 50, 'daily', null, null, true);

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select array_agg(total_paid order by name) from public.loan_overview),
  array[300.00, 0]::numeric[],
  'loan_overview sums actual repayments per loan, zero when none');
select is(
  (select count(*)::int from public.loan_overview where workspace_id = 'bbbbbbbb-1111-0000-0000-000000000001'),
  0, 'user A sees none of B''s loans through the view');

select is((select total_borrowed from public.loan_summary('aaaaaaaa-1111-0000-0000-000000000001')), 1500.00::numeric, 'total_borrowed sums principals');
select is((select total_repaid from public.loan_summary('aaaaaaaa-1111-0000-0000-000000000001')), 300.00::numeric, 'total_repaid sums payments');
select is((select total_outstanding from public.loan_summary('aaaaaaaa-1111-0000-0000-000000000001')), 1400.00::numeric, 'total_outstanding sums balances');
select is((select total_borrowed from public.loan_summary('bbbbbbbb-1111-0000-0000-000000000001')), 0::numeric, 'user A gets zeros for B''s workspace');

select is((select active_count from public.recurring_summary('aaaaaaaa-1111-0000-0000-000000000001')), 3::bigint, 'paused rules are not counted');
select is(
  (select monthly_expense from public.recurring_summary('aaaaaaaa-1111-0000-0000-000000000001')),
  (10 * 30 + 100 * 2 * 4.345)::numeric,
  'daily is x30, weekly is x weekdays x 4.345, paused rules excluded');
select is((select monthly_income from public.recurring_summary('aaaaaaaa-1111-0000-0000-000000000001')), 5000.00::numeric, 'monthly rules count once');

set local role anon;
select throws_ok(
  $$select * from public.loan_summary('aaaaaaaa-1111-0000-0000-000000000001')$$,
  '42501', null, 'anon cannot execute loan_summary');

select * from finish();
rollback;
