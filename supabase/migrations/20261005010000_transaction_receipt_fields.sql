-- Lets the transaction RPCs write the receipt columns added in
-- 20261005000000_receipt_scanning.sql. The new parameters default to null so
-- existing callers keep working; the old signatures are dropped first because
-- an overload with extra defaulted params would make every call ambiguous.
--
-- Update semantics: the form always sends the current receipt fields, so
-- null means "none" (cleared), not "unchanged".

drop function if exists public.create_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb);
drop function if exists public.update_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb);

-- Shared validation for the receipt fields; raises user-facing messages.
create or replace function public.assert_valid_receipt_fields(
  p_workspace_id uuid,
  p_tax_amount numeric,
  p_discount_amount numeric,
  p_receipt_path text
) returns void
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if p_tax_amount < 0 or p_discount_amount < 0 then
    raise exception 'Tax and discount can''t be negative.';
  end if;
  if p_receipt_path is not null and (
    p_receipt_path not like p_workspace_id::text || '/%'
    or not exists (select 1 from storage.objects where bucket_id = 'receipts' and name = p_receipt_path)
  ) then
    raise exception 'The attached receipt wasn''t found. Upload it again.';
  end if;
end;
$$;

revoke execute on function public.assert_valid_receipt_fields(uuid, numeric, numeric, text) from public, anon;
grant execute on function public.assert_valid_receipt_fields(uuid, numeric, numeric, text) to authenticated;

create or replace function public.create_transaction_with_items(
  p_workspace_id uuid,
  p_type text,
  p_account_id uuid,
  p_loan_id uuid,
  p_category text,
  p_merchant text,
  p_amount numeric,
  p_date date,
  p_notes text,
  p_items jsonb,
  p_tax_amount numeric default null,
  p_discount_amount numeric default null,
  p_receipt_path text default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_category_id uuid;
  v_merchant_id uuid;
  v_transaction_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to add a transaction.';
  end if;
  if p_type not in ('expense', 'income', 'loan') then
    raise exception 'Select a valid transaction type.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero.';
  end if;
  if not exists (select 1 from accounts where id = p_account_id and workspace_id = p_workspace_id) then
    raise exception 'Select a valid account.';
  end if;
  if p_loan_id is not null
     and not exists (select 1 from loans where id = p_loan_id and workspace_id = p_workspace_id) then
    raise exception 'Select a valid loan.';
  end if;
  perform public.assert_valid_receipt_fields(p_workspace_id, p_tax_amount, p_discount_amount, p_receipt_path);

  insert into categories (workspace_id, type, name)
    values (p_workspace_id, p_type, trim(p_category))
    on conflict (workspace_id, type, name) do update set name = excluded.name
    returning id into v_category_id;

  insert into merchants (workspace_id, name)
    values (p_workspace_id, trim(p_merchant))
    on conflict (workspace_id, name) do update set name = excluded.name
    returning id into v_merchant_id;

  insert into transactions (workspace_id, user_id, account_id, loan_id, category_id, merchant_id, notes, amount, date,
                            tax_amount, discount_amount, receipt_path)
    values (p_workspace_id, v_user_id, p_account_id, p_loan_id, v_category_id, v_merchant_id,
            nullif(trim(p_notes), ''), case when p_type = 'income' then p_amount else -p_amount end, p_date,
            p_tax_amount, p_discount_amount, p_receipt_path)
    returning id into v_transaction_id;

  insert into transaction_items (transaction_id, name, quantity, unit_price, total_price)
    select v_transaction_id, item.name, item.quantity, item.unit_price, item.total_price
    from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
      as item(name text, quantity numeric, unit_price numeric, total_price numeric);

  return v_transaction_id;
end;
$$;

create or replace function public.update_transaction_with_items(
  p_transaction_id uuid,
  p_type text,
  p_account_id uuid,
  p_loan_id uuid,
  p_category text,
  p_merchant text,
  p_amount numeric,
  p_date date,
  p_notes text,
  p_items jsonb,
  p_tax_amount numeric default null,
  p_discount_amount numeric default null,
  p_receipt_path text default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_transaction transactions%rowtype;
  v_category_id uuid;
  v_merchant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to update a transaction.';
  end if;

  select * into v_transaction from transactions where id = p_transaction_id for update;
  if not found then
    raise exception 'Transaction not found.';
  end if;
  if v_transaction.user_id <> auth.uid() then
    raise exception 'You don''t have permission to update this transaction.';
  end if;

  if p_type not in ('expense', 'income', 'loan') then
    raise exception 'Select a valid transaction type.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero.';
  end if;
  if not exists (select 1 from accounts where id = p_account_id and workspace_id = v_transaction.workspace_id) then
    raise exception 'Select a valid account.';
  end if;
  if p_loan_id is not null
     and not exists (select 1 from loans where id = p_loan_id and workspace_id = v_transaction.workspace_id) then
    raise exception 'Select a valid loan.';
  end if;
  perform public.assert_valid_receipt_fields(v_transaction.workspace_id, p_tax_amount, p_discount_amount, p_receipt_path);

  insert into categories (workspace_id, type, name)
    values (v_transaction.workspace_id, p_type, trim(p_category))
    on conflict (workspace_id, type, name) do update set name = excluded.name
    returning id into v_category_id;

  insert into merchants (workspace_id, name)
    values (v_transaction.workspace_id, trim(p_merchant))
    on conflict (workspace_id, name) do update set name = excluded.name
    returning id into v_merchant_id;

  update transactions
    set account_id = p_account_id,
        loan_id = p_loan_id,
        category_id = v_category_id,
        merchant_id = v_merchant_id,
        notes = nullif(trim(p_notes), ''),
        amount = case when p_type = 'income' then p_amount else -p_amount end,
        date = p_date,
        tax_amount = p_tax_amount,
        discount_amount = p_discount_amount,
        receipt_path = p_receipt_path
    where id = p_transaction_id;

  delete from transaction_items where transaction_id = p_transaction_id;

  insert into transaction_items (transaction_id, name, quantity, unit_price, total_price)
    select p_transaction_id, item.name, item.quantity, item.unit_price, item.total_price
    from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
      as item(name text, quantity numeric, unit_price numeric, total_price numeric);
end;
$$;

revoke execute on function public.create_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb, numeric, numeric, text) from public, anon;
revoke execute on function public.update_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb, numeric, numeric, text) from public, anon;
grant execute on function public.create_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb, numeric, numeric, text) to authenticated;
grant execute on function public.update_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb, numeric, numeric, text) to authenticated;

notify pgrst, 'reload schema';
