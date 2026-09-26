-- Transfers post two ledger transactions plus a transfers row. Doing that from
-- the app was several independent requests, so a failure midway left orphan
-- rows and skewed balances. These functions run each flow in one transaction.
--
-- security invoker: RLS still applies to every statement inside.

create or replace function public.create_transfer(
  p_workspace_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_date date,
  p_notes text
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_from_name text;
  v_to_name text;
  v_category_id uuid;
  v_merchant_id uuid;
  v_from_tx uuid;
  v_to_tx uuid;
  v_transfer_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to record a transfer.';
  end if;
  if p_from_account_id = p_to_account_id then
    raise exception 'Choose two different accounts.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero.';
  end if;

  select name into v_from_name from accounts
    where id = p_from_account_id and workspace_id = p_workspace_id;
  select name into v_to_name from accounts
    where id = p_to_account_id and workspace_id = p_workspace_id;
  if v_from_name is null or v_to_name is null then
    raise exception 'Select valid accounts.';
  end if;

  insert into categories (workspace_id, type, name)
    values (p_workspace_id, 'transfer', 'Transfer')
    on conflict (workspace_id, type, name) do update set name = excluded.name
    returning id into v_category_id;

  insert into merchants (workspace_id, name)
    values (p_workspace_id, 'Transfer')
    on conflict (workspace_id, name) do update set name = excluded.name
    returning id into v_merchant_id;

  insert into transactions (workspace_id, user_id, account_id, category_id, merchant_id, notes, amount, date, status)
    values (p_workspace_id, v_user_id, p_from_account_id, v_category_id, v_merchant_id,
            coalesce(nullif(p_notes, ''), 'Transfer to ' || v_to_name), -p_amount, p_date, 'cleared')
    returning id into v_from_tx;

  insert into transactions (workspace_id, user_id, account_id, category_id, merchant_id, notes, amount, date, status)
    values (p_workspace_id, v_user_id, p_to_account_id, v_category_id, v_merchant_id,
            coalesce(nullif(p_notes, ''), 'Transfer from ' || v_from_name), p_amount, p_date, 'cleared')
    returning id into v_to_tx;

  insert into transfers (workspace_id, user_id, from_account_id, to_account_id, amount, date, notes,
                         from_transaction_id, to_transaction_id)
    values (p_workspace_id, v_user_id, p_from_account_id, p_to_account_id, p_amount, p_date,
            nullif(p_notes, ''), v_from_tx, v_to_tx)
    returning id into v_transfer_id;

  return v_transfer_id;
end;
$$;

create or replace function public.update_transfer(
  p_transfer_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_date date,
  p_notes text
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_transfer transfers%rowtype;
  v_from_name text;
  v_to_name text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to update a transfer.';
  end if;
  if p_from_account_id = p_to_account_id then
    raise exception 'Choose two different accounts.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero.';
  end if;

  select * into v_transfer from transfers where id = p_transfer_id for update;
  if not found then
    raise exception 'Transfer not found.';
  end if;
  if v_transfer.user_id <> auth.uid() then
    raise exception 'You don''t have permission to update this transfer.';
  end if;
  if v_transfer.from_transaction_id is null or v_transfer.to_transaction_id is null then
    raise exception 'This transfer is missing its ledger entries and can''t be edited here.';
  end if;

  select name into v_from_name from accounts
    where id = p_from_account_id and workspace_id = v_transfer.workspace_id;
  select name into v_to_name from accounts
    where id = p_to_account_id and workspace_id = v_transfer.workspace_id;
  if v_from_name is null or v_to_name is null then
    raise exception 'Select valid accounts.';
  end if;

  update transactions
    set account_id = p_from_account_id, amount = -p_amount, date = p_date,
        notes = coalesce(nullif(p_notes, ''), 'Transfer to ' || v_to_name)
    where id = v_transfer.from_transaction_id;

  update transactions
    set account_id = p_to_account_id, amount = p_amount, date = p_date,
        notes = coalesce(nullif(p_notes, ''), 'Transfer from ' || v_from_name)
    where id = v_transfer.to_transaction_id;

  update transfers
    set from_account_id = p_from_account_id, to_account_id = p_to_account_id,
        amount = p_amount, date = p_date, notes = nullif(p_notes, '')
    where id = p_transfer_id;
end;
$$;

create or replace function public.delete_transfer(p_transfer_id uuid) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_transfer transfers%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in to delete a transfer.';
  end if;

  select * into v_transfer from transfers where id = p_transfer_id for update;
  if not found then
    raise exception 'Transfer not found.';
  end if;
  if v_transfer.user_id <> auth.uid() then
    raise exception 'You don''t have permission to delete this transfer.';
  end if;

  delete from transactions
    where id in (v_transfer.from_transaction_id, v_transfer.to_transaction_id);
  delete from transfers where id = p_transfer_id;
end;
$$;

revoke execute on function public.create_transfer(uuid, uuid, uuid, numeric, date, text) from public, anon;
revoke execute on function public.update_transfer(uuid, uuid, uuid, numeric, date, text) from public, anon;
revoke execute on function public.delete_transfer(uuid) from public, anon;
grant execute on function public.create_transfer(uuid, uuid, uuid, numeric, date, text) to authenticated;
grant execute on function public.update_transfer(uuid, uuid, uuid, numeric, date, text) to authenticated;
grant execute on function public.delete_transfer(uuid) to authenticated;
