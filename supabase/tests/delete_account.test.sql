begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- A: solo user with a full ledger (incl. a transfer, whose RESTRICT FK on
--    accounts is what breaks a naive cascade). B: unrelated bystander.
-- C owns a workspace shared with member D.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.local'),
  ('cccccccc-0000-0000-0000-000000000001', 'c@test.local'),
  ('dddddddd-0000-0000-0000-000000000001', 'd@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'B', 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('cccccccc-1111-0000-0000-000000000001', 'C', 'cccccccc-0000-0000-0000-000000000001');

insert into public.workspace_members (workspace_id, user_id, role) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'owner'),
  ('cccccccc-1111-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'owner'),
  ('cccccccc-1111-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 'member');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'A1', 100),
  ('aaaaaaaa-2222-0000-0000-000000000002', 'aaaaaaaa-1111-0000-0000-000000000001', 'A2', 0),
  ('bbbbbbbb-2222-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001', 'B1', 0);

insert into public.transactions (workspace_id, user_id, account_id, amount) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000001', -25),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-2222-0000-0000-000000000001', -5);

insert into public.transfers (workspace_id, user_id, from_account_id, to_account_id, amount) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-2222-0000-0000-000000000002', 10);

insert into public.loans (id, workspace_id, user_id, name, lender, principal_amount, outstanding_balance, status) values
  ('aaaaaaaa-4444-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Car', 'Bank', 1000, 1000, 'active');

set local role anon;
select throws_ok($$select public.delete_my_account()$$, '42501', null, 'anon cannot call delete_my_account');

set local role authenticated;

set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok($$select public.delete_my_account()$$, 'P0001', null, 'an owner of a shared workspace is refused');

set local request.jwt.claims = '{"sub":"dddddddd-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok($$select public.delete_my_account()$$, 'P0001', null, 'a member of someone else''s workspace is refused');

set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok($$select public.delete_my_account()$$, 'a solo user with transfers can delete their account');

reset role;

select is((select count(*)::int from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0, 'A''s auth user is gone');
select is((select count(*)::int from public.workspaces where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0, 'A''s workspace is gone');
select is(
  (select count(*)::int from public.transactions where workspace_id = 'aaaaaaaa-1111-0000-0000-000000000001')
  + (select count(*)::int from public.transfers where workspace_id = 'aaaaaaaa-1111-0000-0000-000000000001')
  + (select count(*)::int from public.accounts where workspace_id = 'aaaaaaaa-1111-0000-0000-000000000001')
  + (select count(*)::int from public.loans where workspace_id = 'aaaaaaaa-1111-0000-0000-000000000001'),
  0, 'A''s ledger rows are gone');
select is(
  (select count(*)::int from public.transactions where workspace_id = 'bbbbbbbb-1111-0000-0000-000000000001'),
  1, 'B''s ledger is untouched');
select is(
  (select count(*)::int from auth.users where id in ('cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001')),
  2, 'refused users still exist');

select * from finish();
rollback;
