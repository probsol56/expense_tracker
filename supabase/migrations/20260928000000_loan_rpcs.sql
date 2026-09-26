-- Loans post a ledger transaction and adjust outstanding_balance. From the app
-- that was several requests plus a read-modify-write on the balance, so a
-- failure left half-posted loans and two concurrent repayments could both read
-- the same balance. Each flow now runs as one transaction and locks the loan
-- row (select ... for update) before touching the balance.
--
-- security invoker: RLS still applies to every statement inside.

create or replace function public.create_loan(
  p_workspace_id uuid,
  p_name text,
  p_lender text,
  p_principal numeric,
  p_date date,
  p_notes text,
  p_account_id uuid
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_category_id uuid;
  v_merchant_id uuid;
  v_loan_id uuid;
  v_transaction_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to add a loan.';
  end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_lender), '') = '' or p_principal is null or p_principal <= 0 then
    raise exception 'Loan name, lender, and valid amount are required.';
  end if;
  if not exists (select 1 from accounts where id = p_account_id and workspace_id = p_workspace_id) then
    raise exception 'Select a valid account.';
  end if;

  insert into categories (workspace_id, type, name)
    values (p_workspace_id, 'loan', 'Loan')
    on conflict (workspace_id, type, name) do update set name = excluded.name
    returning id into v_category_id;

  insert into merchants (workspace_id, name)
    values (p_workspace_id, trim(p_lender))
    on conflict (workspace_id, name) do update set name = excluded.name
    returning id into v_merchant_id;

  insert into loans (workspace_id, user_id, name, lender, principal_amount, outstanding_balance, date_started, notes, status)
    values (p_workspace_id, v_user_id, trim(p_name), trim(p_lender), p_principal, p_principal, p_date,
            nullif(p_notes, ''), 'active')
    returning id into v_loan_id;

  insert into transactions (workspace_id, user_id, account_id, loan_id, category_id, merchant_id, notes, amount, date, status)
    values (p_workspace_id, v_user_id, p_account_id, v_loan_id, v_category_id, v_merchant_id,
            coalesce(nullif(p_notes, ''), 'Loan disbursement from ' || trim(p_lender)), p_principal, p_date, 'cleared')
    returning id into v_transaction_id;

  update loans set transaction_id = v_transaction_id where id = v_loan_id;

  return v_loan_id;
end;
$$;

create or replace function public.update_loan(
  p_loan_id uuid,
  p_name text,
  p_lender text,
  p_principal numeric,
  p_date date,
  p_notes text,
  p_account_id uuid
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_loan loans%rowtype;
  v_next_outstanding numeric;
  v_category_id uuid;
  v_merchant_id uuid;
  v_transaction_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to update a loan.';
  end if;

  select * into v_loan from loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan not found.';
  end if;
  if v_loan.user_id <> auth.uid() then
    raise exception 'You don''t have permission to update this loan.';
  end if;

  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_lender), '') = '' or p_date is null
     or p_principal is null or p_principal <= 0 then
    raise exception 'Loan name, lender, date, and a valid amount are required.';
  end if;
  if v_loan.transaction_id is not null and p_account_id is null then
    raise exception 'Select which account received the loan.';
  end if;
  if p_account_id is not null
     and not exists (select 1 from accounts where id = p_account_id and workspace_id = v_loan.workspace_id) then
    raise exception 'Select a valid account.';
  end if;

  -- Repayments already made are untouched by this edit: shift the outstanding
  -- balance by exactly the change in principal.
  v_next_outstanding := v_loan.outstanding_balance + (p_principal - v_loan.principal_amount);
  if v_next_outstanding < 0 then
    raise exception 'New amount is less than what''s already been repaid on this loan.';
  end if;

  insert into merchants (workspace_id, name)
    values (v_loan.workspace_id, trim(p_lender))
    on conflict (workspace_id, name) do update set name = excluded.name
    returning id into v_merchant_id;

  if v_loan.transaction_id is not null then
    update transactions
      set amount = p_principal, date = p_date, account_id = p_account_id, merchant_id = v_merchant_id,
          notes = coalesce(nullif(p_notes, ''), 'Loan disbursement from ' || trim(p_lender))
      where id = v_loan.transaction_id;
  elsif p_account_id is not null then
    -- Loan predates account tracking: post the disbursement now instead of
    -- leaving it invisible to account balances.
    insert into categories (workspace_id, type, name)
      values (v_loan.workspace_id, 'loan', 'Loan')
      on conflict (workspace_id, type, name) do update set name = excluded.name
      returning id into v_category_id;

    insert into transactions (workspace_id, user_id, account_id, loan_id, category_id, merchant_id, notes, amount, date, status)
      values (v_loan.workspace_id, auth.uid(), p_account_id, p_loan_id, v_category_id, v_merchant_id,
              coalesce(nullif(p_notes, ''), 'Loan disbursement from ' || trim(p_lender)), p_principal, p_date, 'cleared')
      returning id into v_transaction_id;
  end if;

  update loans
    set name = trim(p_name),
        lender = trim(p_lender),
        principal_amount = p_principal,
        outstanding_balance = v_next_outstanding,
        date_started = p_date,
        notes = nullif(p_notes, ''),
        transaction_id = coalesce(v_loan.transaction_id, v_transaction_id),
        status = case
          when v_loan.status = 'closed' then 'closed'
          when v_next_outstanding <= 0 then 'paid'
          else 'active'
        end
    where id = p_loan_id;
end;
$$;

create or replace function public.record_loan_payment(
  p_loan_id uuid,
  p_amount numeric,
  p_date date,
  p_notes text,
  p_account_id uuid
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_loan loans%rowtype;
  v_category_id uuid;
  v_merchant_id uuid;
  v_transaction_id uuid;
  v_payment_id uuid;
  v_next_balance numeric;
begin
  if auth.uid() is null then
    raise exception 'Sign in to record a loan payment.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;

  -- The row lock serialises concurrent repayments on the same loan.
  select * into v_loan from loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan not found.';
  end if;
  if v_loan.user_id <> auth.uid() then
    raise exception 'You don''t have permission to update this loan.';
  end if;
  if p_amount > v_loan.outstanding_balance then
    raise exception 'Payment exceeds the remaining balance for this loan.';
  end if;
  if not exists (select 1 from accounts where id = p_account_id and workspace_id = v_loan.workspace_id) then
    raise exception 'Select a valid account.';
  end if;

  insert into categories (workspace_id, type, name)
    values (v_loan.workspace_id, 'loan', 'Loan')
    on conflict (workspace_id, type, name) do update set name = excluded.name
    returning id into v_category_id;

  insert into merchants (workspace_id, name)
    values (v_loan.workspace_id, v_loan.lender)
    on conflict (workspace_id, name) do update set name = excluded.name
    returning id into v_merchant_id;

  insert into transactions (workspace_id, user_id, account_id, loan_id, category_id, merchant_id, notes, amount, date, status)
    values (v_loan.workspace_id, auth.uid(), p_account_id, p_loan_id, v_category_id, v_merchant_id,
            coalesce(nullif(p_notes, ''), 'Repayment: ' || v_loan.name), -p_amount, p_date, 'cleared')
    returning id into v_transaction_id;

  insert into loan_payments (loan_id, workspace_id, user_id, amount, date, notes, transaction_id)
    values (p_loan_id, v_loan.workspace_id, auth.uid(), p_amount, p_date, nullif(p_notes, ''), v_transaction_id)
    returning id into v_payment_id;

  v_next_balance := v_loan.outstanding_balance - p_amount;
  update loans
    set outstanding_balance = v_next_balance,
        status = case when v_next_balance <= 0 then 'paid' else 'active' end
    where id = p_loan_id;

  return v_payment_id;
end;
$$;

revoke execute on function public.create_loan(uuid, text, text, numeric, date, text, uuid) from public, anon;
revoke execute on function public.update_loan(uuid, text, text, numeric, date, text, uuid) from public, anon;
revoke execute on function public.record_loan_payment(uuid, numeric, date, text, uuid) from public, anon;
grant execute on function public.create_loan(uuid, text, text, numeric, date, text, uuid) to authenticated;
grant execute on function public.update_loan(uuid, text, text, numeric, date, text, uuid) to authenticated;
grant execute on function public.record_loan_payment(uuid, numeric, date, text, uuid) to authenticated;
