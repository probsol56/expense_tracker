begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

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

create temp table result (loan_id uuid);
grant all on result to authenticated;

insert into result
  select public.create_loan(
    'aaaaaaaa-1111-0000-0000-000000000001', 'Car', 'Bank', 1000, '2026-09-01', '',
    'aaaaaaaa-2222-0000-0000-000000000001');

select is(
  (select outstanding_balance from public.loans), 1000.00::numeric,
  'create_loan starts with the full principal outstanding');
select is(
  (select count(*)::int from public.loans l join public.transactions t on t.id = l.transaction_id),
  1, 'create_loan links the disbursement transaction');
select is(
  (select balance from public.accounts where id = 'aaaaaaaa-2222-0000-0000-000000000001'),
  1000.00::numeric, 'disbursement credits the account');

select public.record_loan_payment(
  (select loan_id from result), 300, '2026-09-05', '', 'aaaaaaaa-2222-0000-0000-000000000001');
select is(
  (select outstanding_balance from public.loans), 700.00::numeric,
  'record_loan_payment reduces outstanding_balance');
select is(
  (select balance from public.accounts where id = 'aaaaaaaa-2222-0000-0000-000000000001'),
  700.00::numeric, 'repayment debits the account');

select throws_ok(
  format($$select public.record_loan_payment(%L, 5000, '2026-09-06', '', 'aaaaaaaa-2222-0000-0000-000000000001')$$,
         (select loan_id from result)),
  'P0001', 'Payment exceeds the remaining balance for this loan.', 'rejects overpayment');

select throws_ok(
  format($$select public.record_loan_payment(%L, 50, null, '', 'aaaaaaaa-2222-0000-0000-000000000001')$$,
         (select loan_id from result)),
  '23502', null, 'a failure after the lock raises (null date)');
select is(
  (select outstanding_balance from public.loans)
    || '/' || (select count(*) from public.loan_payments)
    || '/' || (select count(*) from public.transactions),
  '700.00/1/2', 'failed payment leaves loan, payments and transactions untouched');

select public.update_loan(
  (select loan_id from result), 'Car', 'Bank', 1500, '2026-09-01', '',
  'aaaaaaaa-2222-0000-0000-000000000001');
select is(
  (select outstanding_balance from public.loans), 1200.00::numeric,
  'update_loan shifts outstanding by the principal change');

select throws_ok(
  format($$select public.update_loan(%L, 'Car', 'Bank', 200, '2026-09-01', '', 'aaaaaaaa-2222-0000-0000-000000000001')$$,
         (select loan_id from result)),
  'P0001', 'New amount is less than what''s already been repaid on this loan.',
  'update_loan cannot drop principal below what was repaid');

set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  format($$select public.record_loan_payment(%L, 10, '2026-09-06', '', 'bbbbbbbb-2222-0000-0000-000000000001')$$,
         (select loan_id from result)),
  'P0001', 'Loan not found.', 'B cannot repay A loan');

set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';
select public.record_loan_payment(
  (select loan_id from result), 1200, '2026-09-10', '', 'aaaaaaaa-2222-0000-0000-000000000001');
select is(
  (select status from public.loans), 'paid', 'paying off the balance marks the loan paid');

reset role;
set local role anon;
select throws_ok(
  $$select public.record_loan_payment('aaaaaaaa-4444-0000-0000-000000000001', 1, '2026-09-01', '', null)$$,
  '42501', null, 'anon cannot execute loan functions');

select * from finish();
rollback;
