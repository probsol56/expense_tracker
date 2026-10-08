begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'B', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'A1', 0),
  ('aaaaaaaa-2222-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'A2', 0),
  ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'B1', 0);

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

create temp table result (transfer_id uuid);
grant all on result to authenticated;

insert into result
  select public.create_transfer(
    'aaaaaaaa-1111-0000-0000-000000000001',
    'aaaaaaaa-2222-0000-0000-000000000001',
    'aaaaaaaa-2222-0000-0000-000000000002',
    25, '2026-09-01', '', '', '');

select is((select count(*)::int from public.transfers), 1, 'create_transfer inserts the transfer');
select is((select count(*)::int from public.transactions), 2, 'create_transfer posts both legs');
select is(
  (select array_agg(balance order by name) from public.accounts),
  array[-25.00, 25.00]::numeric[],
  'balances move by the transfer amount');

select public.update_transfer(
  (select transfer_id from result),
  'aaaaaaaa-2222-0000-0000-000000000001',
  'aaaaaaaa-2222-0000-0000-000000000002',
  40, '2026-09-02', 'rent split', '', '');
select is(
  (select array_agg(balance order by name) from public.accounts),
  array[-40.00, 40.00]::numeric[],
  'update_transfer re-syncs both balances');

create temp table external_result (transfer_id uuid);
grant all on external_result to authenticated;
insert into external_result
  select public.create_transfer(
    'aaaaaaaa-1111-0000-0000-000000000001',
    'aaaaaaaa-2222-0000-0000-000000000001',
    null,
    10, '2026-09-03', '', 'Alex', '');
select is((select count(*)::int from public.transactions), 3, 'external transfer posts only the source ledger entry');
select is(
  (select array_agg(balance order by name) from public.accounts),
  array[-50.00, 40.00]::numeric[],
  'external transfer reduces only the source account balance');
select is(
  (select to_account_id is null and to_account_name = 'Alex' from public.transfers where id = (select transfer_id from external_result)),
  true,
  'external recipient is stored without an account');

select public.update_transfer(
  (select transfer_id from external_result),
  'aaaaaaaa-2222-0000-0000-000000000001',
  'aaaaaaaa-2222-0000-0000-000000000002',
  20, '2026-09-04', '', '', '');
select is(
  (select array_agg(balance order by name) from public.accounts),
  array[-60.00, 60.00]::numeric[],
  'updating external to internal restores the destination balance leg');

select public.update_transfer(
  (select transfer_id from result),
  'aaaaaaaa-2222-0000-0000-000000000001',
  null,
  40, '2026-09-05', '', 'Pat', '');
select is((select count(*)::int from public.transactions), 3, 'updating internal to external removes the destination ledger entry');
select is(
  (select array_agg(balance order by name) from public.accounts),
  array[-60.00, 20.00]::numeric[],
  'updating internal to external removes the destination balance');

create temp table incoming_result (transfer_id uuid);
grant all on incoming_result to authenticated;
insert into incoming_result
  select public.create_transfer(
    'aaaaaaaa-1111-0000-0000-000000000001',
    null,
    'aaaaaaaa-2222-0000-0000-000000000002',
    15, '2026-09-06', '', '', 'Other Bank');
select is((select count(*)::int from public.transactions), 4, 'incoming external transfer posts only the destination ledger entry');
select is(
  (select array_agg(balance order by name) from public.accounts),
  array[-60.00, 35.00]::numeric[],
  'incoming external transfer increases only the destination account balance');
select is(
  (select from_account_id is null and from_account_name = 'Other Bank' from public.transfers where id = (select transfer_id from incoming_result)),
  true,
  'external source is stored without an account');

select public.update_transfer(
  (select transfer_id from incoming_result),
  'aaaaaaaa-2222-0000-0000-000000000001',
  'aaaaaaaa-2222-0000-0000-000000000002',
  25, '2026-09-07', '', '', '');
select is((select count(*)::int from public.transactions), 5, 'updating external source to internal creates the debit ledger entry');
select is(
  (select array_agg(balance order by name) from public.accounts),
  array[-85.00, 45.00]::numeric[],
  'updating external source to internal adjusts both account balances');

select public.update_transfer(
  (select transfer_id from incoming_result),
  null,
  'aaaaaaaa-2222-0000-0000-000000000002',
  25, '2026-09-08', '', '', 'Other Bank');
select is((select count(*)::int from public.transactions), 4, 'updating internal source to external removes the debit ledger entry');
select is(
  (select array_agg(balance order by name) from public.accounts),
  array[-60.00, 45.00]::numeric[],
  'updating internal source to external removes the source balance debit');

select throws_ok(
  $$select public.create_transfer(
      'aaaaaaaa-1111-0000-0000-000000000001',
      'aaaaaaaa-2222-0000-0000-000000000001',
      'bbbbbbbb-2222-0000-0000-000000000001',
      5, '2026-09-01', '', '', '')$$,
  'P0001', 'Select a valid destination account.', 'rejects an account from another workspace');

select throws_ok(
  $$select public.create_transfer(
      'aaaaaaaa-1111-0000-0000-000000000001',
      'aaaaaaaa-2222-0000-0000-000000000001',
      'aaaaaaaa-2222-0000-0000-000000000002',
      5, null, '', '', '')$$,
  '23502', null, 'a failure after the category upsert raises (null date)');

select is(
  (select count(*)::int from public.transfers) + (select count(*)::int from public.transactions),
  7,
  'failed create leaves no partial transfer or transaction rows');

select is(
  (select count(*)::int from public.categories where name = 'Transfer'),
  1,
  'failed create leaves no duplicate helper category');

-- Another workspace's user cannot touch A's transfer
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  format($$select public.delete_transfer(%L)$$, (select transfer_id from result)),
  'P0001', 'Transfer not found.', 'B cannot delete A transfer');

set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
select public.delete_transfer((select transfer_id from result));
select public.delete_transfer((select transfer_id from external_result));
select public.delete_transfer((select transfer_id from incoming_result));
select is(
  (select count(*)::int from public.transfers) + (select count(*)::int from public.transactions),
  0,
  'delete_transfer removes external and internal transfers with their ledger entries');

reset role;
set local role anon;
select throws_ok(
  $$select public.delete_transfer('aaaaaaaa-4444-0000-0000-000000000001')$$,
  '42501', null, 'anon cannot execute transfer functions');

select * from finish();
rollback;
