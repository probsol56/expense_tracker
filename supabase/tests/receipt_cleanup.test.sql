begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'A1', 0);

insert into storage.objects (bucket_id, name, created_at) values
  ('receipts', 'aaaaaaaa-1111-0000-0000-000000000001/attached.jpg', now() - interval '2 days'),
  ('receipts', 'aaaaaaaa-1111-0000-0000-000000000001/orphan.jpg', now() - interval '2 days'),
  ('receipts', 'aaaaaaaa-1111-0000-0000-000000000001/fresh.jpg', now() - interval '1 hour');

insert into public.transactions (workspace_id, user_id, account_id, amount, receipt_path) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-2222-0000-0000-000000000001', -100, 'aaaaaaaa-1111-0000-0000-000000000001/attached.jpg');

insert into public.receipt_scans (workspace_id, user_id, receipt_path, created_at) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-1111-0000-0000-000000000001/old.jpg', now() - interval '31 days'),
  ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-1111-0000-0000-000000000001/recent.jpg', now() - interval '1 day');

select is(
  array(select public.list_orphaned_receipts(100)),
  array['aaaaaaaa-1111-0000-0000-000000000001/orphan.jpg'],
  'lists only unreferenced receipts past the grace period');

select is(
  (select count(*)::int from public.list_orphaned_receipts(0)), 1,
  'a non-positive limit still returns at least one row');

select public.prune_receipt_scans();

select is(
  array(select receipt_path from public.receipt_scans),
  array['aaaaaaaa-1111-0000-0000-000000000001/recent.jpg'],
  'prune_receipt_scans drops scans older than 30 days');

select is(
  (select count(*)::int from cron.job where jobname in ('cleanup-receipts', 'prune-receipt-scans')), 2,
  'both cleanup jobs are scheduled');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select throws_ok(
  $$select public.list_orphaned_receipts(100)$$,
  '42501', null, 'users cannot list orphaned receipts');

select throws_ok(
  $$select public.prune_receipt_scans()$$,
  '42501', null, 'users cannot prune scans');

select * from finish();
rollback;
