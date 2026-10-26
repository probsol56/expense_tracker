begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-1111-0000-0000-0000-000000000001', 'B', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'A1', 100),
  ('aaaaaaaa-2222-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'A2', 200),
  ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-0000-000000000001', 'B1', 5000);

insert into public.transactions (id, workspace_id, user_id, account_id, amount, date, created_at) values
  ('aaaaaaaa-5555-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', -20, '2026-09-01', '2026-09-01 10:00:00+00'),
  ('aaaaaaaa-5555-0000-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-0000-000000000001', 50, '2026-09-10', '2026-09-10 10:00:00+00'),
  ('aaaaaaaa-5555-0000-0000-0000-000000000003', 'aaaaaaaa-1111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-0000-000000000002', -10, '2026-09-11', '2026-09-11 10:00:00+00'),
  ('bbbbbbbb-5555-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-2222-0000-0000-000000000001', 500, '2026-09-01', '2026-09-01 10:00:00+00');

insert into public.transactions (id, workspace_id, user_id, account_id, amount, date, created_at) values
  ('aaaaaaaa-5555-0000-0000-000000000004', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', -5, '2026-09-30', '2026-09-30 10:00:00+00');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select opening_balance from public.transaction_opening_balance(
    'aaaaaaaa-1111-0000-0000-0000-000000000001',
    'aaaaaaaa-2222-0000-0000-000000000001',
    '2026-09-10'
  )),
  80::numeric, 'opening balance includes the account start and transactions before the period');
select is(
  (select opening_balance from public.transaction_opening_balance(
    'aaaaaaaa-1111-0000-0000-0000-000000000001', null, '2026-09-10'
  )),
  280::numeric, 'all-account opening balance aggregates workspace accounts and prior transactions');
select is(
  (select opening_balance from public.transaction_opening_balance(
    'aaaaaaaa-1111-0000-0000-000000000001',
    'aaaaaaaa-2222-0000-0000-000000000001',
    null
  )),
  100::numeric, 'an unbounded report begins with the account starting balance');
select is(
  (select running_balance from public.transaction_running_balances(
    'aaaaaaaa-1111-0000-0000-000000000001',
    'aaaaaaaa-2222-0000-0000-000000000001',
    array['aaaaaaaa-5555-0000-0000-000000000002'::uuid]
  ) where transaction_id = 'aaaaaaaa-5555-0000-0000-000000000002'),
  130::numeric, 'running balance includes prior entries and excludes later entries in the report range');
select is(
  (select running_balance from public.transaction_running_balances(
    'aaaaaaaa-1111-0000-0000-0000-000000000001',
    null,
    array['aaaaaaaa-5555-0000-0000-000000000003'::uuid]
  ) where transaction_id = 'aaaaaaaa-5555-0000-0000-000000000003'),
  320::numeric, 'all-account running balance includes each account starting balance and earlier entries');
select is(
  (select opening_balance from public.transaction_opening_balance(
    'bbbbbbbb-1111-0000-0000-000000000001', null, '2026-09-10'
  )),
  0::numeric, 'RLS prevents reading another workspace opening balance');
select is(
  (select count(*)::int from public.transaction_running_balances(
    'bbbbbbbb-1111-0000-0000-000000000001',
    null,
    array['bbbbbbbb-5555-0000-0000-000000000001'::uuid]
  )),
  0, 'RLS prevents reading another workspace running balances');

set local role anon;
select throws_ok(
  $$select * from public.transaction_opening_balance('aaaaaaaa-1111-0000-0000-000000000001', null, null)$$,
  '42501', null, 'anon cannot execute the opening balance function');

select * from finish();
rollback;
