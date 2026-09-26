begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- Fixtures (inserted as the migration role, bypassing RLS)
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'B', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'A1', 0),
  ('aaaaaaaa-2222-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'A2', 0),
  ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'B1', 100),
  ('bbbbbbbb-2222-0000-0000-000000000002', 'bbbbbbbb-1111-0000-0000-000000000001', 'B2', 0);

insert into public.transactions (id, workspace_id, user_id, account_id, amount) values
  ('bbbbbbbb-3333-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-2222-0000-0000-000000000001', 10);

insert into public.transfers (id, workspace_id, user_id, from_account_id, to_account_id, amount) values
  ('bbbbbbbb-4444-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000001',
   'bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-2222-0000-0000-000000000002', 5);

-- Act as user A
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select count(*)::int from public.transfers), 0, 'A cannot read B transfers');
select is((select count(*)::int from public.transactions), 0, 'A cannot read B transactions');
select is((select count(*)::int from public.accounts), 2, 'A sees only own accounts');

select throws_ok(
  $$insert into public.transfers (workspace_id, user_id, from_account_id, to_account_id, amount)
    values ('bbbbbbbb-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
            'bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-2222-0000-0000-000000000002', 1)$$,
  '42501', null, 'A cannot insert a transfer into B workspace');

select throws_ok(
  $$insert into public.transfers (workspace_id, user_id, from_account_id, to_account_id, amount)
    values ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
            'bbbbbbbb-2222-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 1)$$,
  '23503', null, 'A cannot transfer from a B account inside A workspace');

select throws_ok(
  $$insert into public.transactions (workspace_id, user_id, account_id, amount)
    values ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
            'bbbbbbbb-2222-0000-0000-000000000001', 50)$$,
  '23503', null, 'A cannot post a transaction against a B account');

select throws_ok(
  $$insert into public.transactions (workspace_id, user_id, amount)
    values ('bbbbbbbb-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 50)$$,
  '42501', null, 'A cannot insert a transaction into B workspace');

-- Mutations on B rows silently affect zero rows under RLS
update public.transactions set amount = 999 where id = 'bbbbbbbb-3333-0000-0000-000000000001';
delete from public.transfers where id = 'bbbbbbbb-4444-0000-0000-000000000001';

select throws_ok(
  $$select public.recalculate_account_balance('bbbbbbbb-2222-0000-0000-000000000001')$$,
  '42501', null, 'authenticated cannot call recalculate_account_balance');

select throws_ok(
  $$select public.generate_recurring_transactions()$$,
  '42501', null, 'authenticated cannot call generate_recurring_transactions');

-- Back to the migration role to confirm B data is untouched
reset role;

select is((select amount from public.transactions where id = 'bbbbbbbb-3333-0000-0000-000000000001'),
  10::numeric, 'B transaction unchanged');
select is((select count(*)::int from public.transfers where id = 'bbbbbbbb-4444-0000-0000-000000000001'),
  1, 'B transfer still exists');
select is((select balance from public.accounts where id = 'bbbbbbbb-2222-0000-0000-000000000001'),
  110::numeric, 'B balance reflects only its own ledger (100 opening + 10)');

-- Moving an own transaction into B workspace is rejected
insert into public.transactions (id, workspace_id, user_id, account_id, amount) values
  ('aaaaaaaa-3333-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', 1);
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  $$update public.transactions set workspace_id = 'bbbbbbbb-1111-0000-0000-000000000001'
    where id = 'aaaaaaaa-3333-0000-0000-000000000001'$$,
  null, null, 'A cannot move a transaction into B workspace');
reset role;

select * from finish();
rollback;
