begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-1111-0000-0000-0000-000000000001', 'B', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'A1', 100),
  ('aaaaaaaa-2222-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'A2', 200),
  ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'B1', 5000);

insert into public.categories (id, workspace_id, type, name) values
  ('aaaaaaaa-3333-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'income', 'Salary'),
  ('aaaaaaaa-3333-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'Food'),
  ('aaaaaaaa-3333-0000-0000-000000000003', 'aaaaaaaa-1111-0000-0000-000000000001', 'transfer', 'Transfer');

insert into public.transactions (id, workspace_id, user_id, account_id, category_id, amount, date) values
  ('aaaaaaaa-5555-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000002', -20, '2026-08-31'),
  ('aaaaaaaa-5555-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000001', 50, '2026-09-01'),
  ('aaaaaaaa-5555-0000-0000-000000000003', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000002', -10, '2026-09-05'),
  ('aaaaaaaa-5555-0000-0000-000000000004', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000003', 200, '2026-09-10'),
  ('aaaaaaaa-5555-0000-0000-000000000005', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000002', 'aaaaaaaa-3333-0000-0000-000000000002', -10, '2026-09-11'),
  ('aaaaaaaa-5555-0000-0000-000000000006', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-3333-0000-0000-000000000002', -5, '2026-10-01');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select opening_balance from public.account_monthly_history(
    'aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01'
  ) where account_id = 'aaaaaaaa-2222-0000-0000-000000000001'),
  80::numeric, 'opening balance includes the starting balance and activity before the month');
select is(
  (select income_amount from public.account_monthly_history(
    'aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01'
  ) where account_id = 'aaaaaaaa-2222-0000-0000-000000000001'),
  50::numeric, 'add money includes income but excludes transfers');
select is(
  (select closing_balance from public.account_monthly_history(
    'aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01'
  ) where account_id = 'aaaaaaaa-2222-0000-0000-000000000001'),
  320::numeric, 'closing balance includes all account activity through the month');
select is(
  (select opening_balance from public.account_monthly_history(
    'aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01'
  ) where account_id = 'aaaaaaaa-2222-0000-0000-000000000002'),
  200::numeric, 'opening balances are calculated separately per account');
select is(
  (select closing_balance from public.account_monthly_history(
    'aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01'
  ) where account_id = 'aaaaaaaa-2222-0000-0000-000000000002'),
  190::numeric, 'closing balances are calculated separately per account');
select is(
  (select count(*)::int from public.account_monthly_history(
    'bbbbbbbb-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01'
  )),
  0, 'RLS prevents reading another workspace account history');

set local role anon;
select throws_ok(
  $$select * from public.account_monthly_history('aaaaaaaa-1111-0000-0000-000000000001', '2026-09-01', '2026-10-01')$$,
  '42501', null, 'anon cannot execute the account monthly history function');

select * from finish();
rollback;
