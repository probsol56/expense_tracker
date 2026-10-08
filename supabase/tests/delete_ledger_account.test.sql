begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'account-owner@test.local'),
  ('ffffffff-0000-0000-0000-000000000001', 'other-owner@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('eeeeeeee-1111-0000-0000-000000000001', 'Account workspace', 'eeeeeeee-0000-0000-0000-000000000001'),
  ('ffffffff-1111-0000-0000-000000000001', 'Other workspace', 'ffffffff-0000-0000-0000-000000000001');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('eeeeeeee-2222-0000-0000-000000000001', 'eeeeeeee-1111-0000-0000-000000000001', 'Used account', 100),
  ('eeeeeeee-2222-0000-0000-000000000002', 'eeeeeeee-1111-0000-0000-000000000001', 'Unused account', 0),
  ('ffffffff-2222-0000-0000-000000000001', 'ffffffff-1111-0000-0000-000000000001', 'Other account', 0);

insert into public.transactions (workspace_id, user_id, account_id, amount) values
  ('eeeeeeee-1111-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-2222-0000-0000-000000000001', -25);

set local role anon;
select throws_ok(
  $$select public.delete_ledger_account('eeeeeeee-2222-0000-0000-000000000002')$$,
  '42501', null, 'anonymous users cannot delete ledger accounts'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  $$select public.delete_ledger_account('eeeeeeee-2222-0000-0000-000000000001')$$,
  'P0001',
  'This account has 1 transaction. Delete or reassign its transactions before deleting this account.',
  'an account with transactions cannot be deleted'
);
select is(
  (with deleted as (
    delete from public.accounts where id = 'eeeeeeee-2222-0000-0000-000000000001' returning 1
  ) select count(*)::int from deleted),
  0,
  'RLS also blocks direct deletion of an account with transactions'
);
select is(
  (select count(*)::int from public.accounts where id = 'eeeeeeee-2222-0000-0000-000000000001'),
  1,
  'the account with transactions remains'
);

set local request.jwt.claims = '{"sub":"ffffffff-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  $$select public.delete_ledger_account('eeeeeeee-2222-0000-0000-000000000002')$$,
  'P0001', 'Account not found.', 'users cannot delete another workspace account'
);

set local request.jwt.claims = '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok(
  $$select public.delete_ledger_account('eeeeeeee-2222-0000-0000-000000000002')$$,
  'an unused account can be deleted'
);
reset role;
select is(
  (select count(*)::int from public.accounts where id = 'eeeeeeee-2222-0000-0000-000000000002'),
  0,
  'the unused account is gone'
);

select * from finish();
rollback;