begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@test.local');

insert into public.workspaces (id, name, owner_id) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'A', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-1111-0000-0000-000000000001', 'B', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into public.accounts (id, workspace_id, name, starting_balance) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'aaaaaaaa-1111-0000-0000-000000000001', 'A1', 0);

insert into storage.objects (bucket_id, name) values
  ('receipts', 'aaaaaaaa-1111-0000-0000-000000000001/r.jpg'),
  ('receipts', 'bbbbbbbb-1111-0000-0000-000000000001/r.jpg');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

create temp table result (transaction_id uuid);
grant all on result to authenticated;

insert into result
  select public.create_transaction_with_items(
    'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'aaaaaaaa-2222-0000-0000-000000000001', null,
    'Groceries', 'Shwapno', 310, '2026-10-01', '',
    '[{"name":"Rice","quantity":1,"unit_price":300,"total_price":300}]',
    15, 5, 'aaaaaaaa-1111-0000-0000-000000000001/r.jpg');

select is(
  (select tax_amount::text || '/' || discount_amount::text || '/' || receipt_path from public.transactions),
  '15.00/5.00/aaaaaaaa-1111-0000-0000-000000000001/r.jpg',
  'create_transaction_with_items stores the receipt fields');

select throws_ok(
  $$select public.create_transaction_with_items(
    'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'aaaaaaaa-2222-0000-0000-000000000001', null,
    'Groceries', 'Shwapno', 10, '2026-10-01', '', '[]', -1, null, null)$$,
  'P0001', 'Tax and discount can''t be negative.', 'rejects a negative tax');

select throws_ok(
  $$select public.create_transaction_with_items(
    'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'aaaaaaaa-2222-0000-0000-000000000001', null,
    'Groceries', 'Shwapno', 10, '2026-10-01', '', '[]', null, null, 'bbbbbbbb-1111-0000-0000-000000000001/r.jpg')$$,
  'P0001', 'The attached receipt wasn''t found. Upload it again.', 'rejects another workspace''s receipt');

select throws_ok(
  $$select public.create_transaction_with_items(
    'aaaaaaaa-1111-0000-0000-000000000001', 'expense', 'aaaaaaaa-2222-0000-0000-000000000001', null,
    'Groceries', 'Shwapno', 10, '2026-10-01', '', '[]', null, null, 'aaaaaaaa-1111-0000-0000-000000000001/missing.jpg')$$,
  'P0001', 'The attached receipt wasn''t found. Upload it again.', 'rejects a receipt that was never uploaded');

select public.update_transaction_with_items(
  (select transaction_id from result), 'expense', 'aaaaaaaa-2222-0000-0000-000000000001', null,
  'Groceries', 'Shwapno', 300, '2026-10-01', '', '[]');

select is(
  (select coalesce(tax_amount::text, 'null') || '/' || coalesce(discount_amount::text, 'null') || '/' || coalesce(receipt_path, 'null')
     from public.transactions),
  'null/null/null', 'update without receipt fields clears them');

select is(
  (select balance from public.accounts where id = 'aaaaaaaa-2222-0000-0000-000000000001'),
  -300.00::numeric, 'the balance follows amount, not the tax/discount breakdown');

select * from finish();
rollback;
