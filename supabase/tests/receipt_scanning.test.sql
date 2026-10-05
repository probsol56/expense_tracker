begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'B', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into public.receipt_scans (workspace_id, user_id, receipt_path) values
  ('bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001',
   'bbbbbbbb-1111-0000-0000-000000000001/b.jpg');

insert into storage.objects (bucket_id, name) values
  ('receipts', 'bbbbbbbb-1111-0000-0000-000000000001/b.jpg');

-- Act as user A
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

create temp table result (scan_id uuid);
grant all on result to authenticated;

-- Scan RPCs
insert into result
  select public.start_receipt_scan('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001/a.jpg');

select is(
  (select status from public.receipt_scans where id = (select scan_id from result)), 'pending',
  'start_receipt_scan logs a pending scan');

select throws_ok(
  $$select public.start_receipt_scan('bbbbbbbb-1111-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001/x.jpg')$$,
  'P0001', 'You don''t have access to this workspace.', 'cannot scan into another workspace');

select throws_ok(
  $$select public.start_receipt_scan('aaaaaaaa-1111-0000-0000-000000000001', 'bbbbbbbb-1111-0000-0000-000000000001/x.jpg')$$,
  'P0001', 'Invalid receipt path.', 'cannot log a path outside the workspace folder');

select lives_ok(
  format($$select public.finish_receipt_scan(%L, 'succeeded')$$, (select scan_id from result)),
  'finish_receipt_scan completes a pending scan');

select throws_ok(
  format($$select public.finish_receipt_scan(%L, 'failed')$$, (select scan_id from result)),
  'P0001', 'Receipt scan not found.', 'a finished scan cannot be rewritten');

select is(
  (select count(*)::int from public.receipt_scans), 1,
  'users see only their own scans');

select throws_ok(
  $$insert into public.receipt_scans (workspace_id, user_id, receipt_path)
    values ('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001/y.jpg')$$,
  '42501', null, 'scans cannot be inserted directly');

select is_empty(
  $$delete from public.receipt_scans returning id$$,
  'scans cannot be deleted to reset the quota');

-- Storage
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('receipts', 'aaaaaaaa-1111-0000-0000-000000000001/a.jpg')$$,
  'can upload into own workspace folder');

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('receipts', 'bbbbbbbb-1111-0000-0000-000000000001/x.jpg')$$,
  '42501', null, 'cannot upload into another workspace folder');

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('receipts', 'not-a-uuid/x.jpg')$$,
  '42501', null, 'a malformed folder is rejected, not cast-errored');

select is(
  (select count(*)::int from storage.objects where bucket_id = 'receipts'), 1,
  'cannot see receipts from another workspace');

-- Daily cap: top A up to the limit as the migration role, then try once more.
reset role;
insert into public.receipt_scans (workspace_id, user_id, receipt_path)
  select 'aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
         'aaaaaaaa-1111-0000-0000-000000000001/cap-' || n || '.jpg'
  from generate_series(1, 29) n;
set local role authenticated;

select throws_ok(
  $$select public.start_receipt_scan('aaaaaaaa-1111-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001/z.jpg')$$,
  'P0001', 'Daily receipt scan limit reached (30). Try again later.', 'the 31st scan in 24h is refused');

select * from finish();
rollback;
