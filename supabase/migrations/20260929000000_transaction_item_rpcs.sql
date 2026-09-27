-- A transaction and its line items were written in separate requests, so a
-- failure between them left a transaction without items (create) or wiped the
-- old items without inserting the new ones (update). Each flow now runs as one
-- transaction.
--
-- p_items is a jsonb array of {name, quantity, unit_price, total_price}.
-- security invoker: RLS still applies to every statement inside.

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
  p_items jsonb
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

  insert into categories (workspace_id, type, name)
    values (p_workspace_id, p_type, trim(p_category))
    on conflict (workspace_id, type, name) do update set name = excluded.name
    returning id into v_category_id;

  insert into merchants (workspace_id, name)
    values (p_workspace_id, trim(p_merchant))
    on conflict (workspace_id, name) do update set name = excluded.name
    returning id into v_merchant_id;

  insert into transactions (workspace_id, user_id, account_id, loan_id, category_id, merchant_id, notes, amount, date)
    values (p_workspace_id, v_user_id, p_account_id, p_loan_id, v_category_id, v_merchant_id,
            nullif(trim(p_notes), ''), case when p_type = 'income' then p_amount else -p_amount end, p_date)
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
  p_items jsonb
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
        date = p_date
    where id = p_transaction_id;

  delete from transaction_items where transaction_id = p_transaction_id;

  insert into transaction_items (transaction_id, name, quantity, unit_price, total_price)
    select p_transaction_id, item.name, item.quantity, item.unit_price, item.total_price
    from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
      as item(name text, quantity numeric, unit_price numeric, total_price numeric);
end;
$$;

revoke execute on function public.create_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb) from public, anon;
revoke execute on function public.update_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb) from public, anon;
grant execute on function public.create_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb) to authenticated;
grant execute on function public.update_transaction_with_items(uuid, text, uuid, uuid, text, text, numeric, date, text, jsonb) to authenticated;
