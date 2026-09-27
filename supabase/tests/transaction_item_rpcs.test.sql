begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'B', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'A1', 0),
  ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'B1', 0);

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

create temp table result (transaction_id uuid);
grant all on result to authenticated;

insert into result
  select public.create_transaction_with_items(
    'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'aaaaaaaa-2222-0000-0000-000000000001', null,
    'Groceries', 'Market', 30, '2026-09-10', '',
    '[{"name":"Milk","quantity":2,"unit_price":5,"total_price":10},{"name":"Bread","quantity":1,"unit_price":20,"total_price":20}]');

select is(
  (select amount from public.transactions), -30.00::numeric,
  'create_transaction_with_items stores expenses as negative amounts');
select is(
  (select count(*)::int from public.transaction_items), 2,
  'create_transaction_with_items inserts every item');
select is(
  (select balance from public.accounts where id = 'aaaaaaaa-2222-0000-0000-000000000001'),
  -30.00::numeric, 'the account balance reflects the new transaction');

select public.update_transaction_with_items(
  (select transaction_id from result), 'income', 'aaaaaaaa-2222-0000-0000-000000000001', null,
  'Refund', 'Market', 50, '2026-09-11', 'store credit',
  '[{"name":"Refund","quantity":1,"unit_price":50,"total_price":50}]');

select is(
  (select amount from public.transactions), 50.00::numeric,
  'update_transaction_with_items flips the sign for income');
select is(
  (select string_agg(name, ',') from public.transaction_items), 'Refund',
  'update_transaction_with_items replaces the old items');

select throws_ok(
  format($$select public.update_transaction_with_items(%L, 'expense', 'aaaaaaaa-2222-0000-0000-000000000001', null,
    'Groceries', 'Market', 10, '2026-09-12', '',
    '[{"name":"Broken","quantity":1,"unit_price":1,"total_price":null}]')$$,
    (select transaction_id from result)),
  '23502', null, 'an invalid item raises');
select is(
  (select amount::text || '/' || count(*)::text from public.transactions, public.transaction_items
    where transaction_items.transaction_id = transactions.id group by amount),
  '50.00/1', 'failed update leaves the transaction and its old items untouched');

select throws_ok(
  $$select public.create_transaction_with_items(
    'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'bbbbbbbb-2222-0000-0000-000000000001', null,
    'Groceries', 'Market', 10, '2026-09-12', '', '[]')$$,
  'P0001', 'Select a valid account.', 'rejects another workspace''s account');

set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  format($$select public.update_transaction_with_items(%L, 'expense', 'bbbbbbbb-2222-0000-0000-000000000001', null,
    'Groceries', 'Market', 10, '2026-09-12', '', '[]')$$,
    (select transaction_id from result)),
  'P0001', 'Transaction not found.', 'another user cannot update the transaction');

reset role;
select is(
  (select count(*)::int from public.transactions), 1,
  'the rejected calls created no extra transactions');

set local role anon;
select throws_ok(
  $$select public.create_transaction_with_items(
    'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'aaaaaaaa-2222-0000-0000-000000000001', null,
    'Groceries', 'Market', 10, '2026-09-12', '', '[]')$$,
  '42501', null, 'anon cannot execute create_transaction_with_items');

select * from finish();
rollback;
