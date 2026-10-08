alter table public.transfers
  alter column from_account_id drop not null,
  add column from_account_name text,
  add constraint transfers_source_check check (
    (from_account_id is not null and from_account_name is null)
    or (from_account_id is null and char_length(btrim(from_account_name)) between 1 and 100)
  ),
  add constraint transfers_tracked_account_check check (from_account_id is not null or to_account_id is not null);

drop function public.create_transfer(uuid, uuid, uuid, numeric, date, text, text);
drop function public.update_transfer(uuid, uuid, uuid, numeric, date, text, text);

create function public.create_transfer(
  p_workspace_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_date date,
  p_notes text,
  p_to_account_name text,
  p_from_account_name text
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
  if p_amount is null or p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero.';
  end if;
  if p_from_account_id is null and p_to_account_id is null then
    raise exception 'A transfer must include one of your accounts.';
  end if;

  if p_from_account_id is null then
    v_from_name := nullif(btrim(p_from_account_name), '');
    if v_from_name is null or char_length(v_from_name) > 100 then
      raise exception 'Enter a valid external source.';
    end if;
  else
    select name into v_from_name from accounts
      where id = p_from_account_id and workspace_id = p_workspace_id;
    if v_from_name is null then
      raise exception 'Select a valid source account.';
    end if;
  end if;

  if p_to_account_id is null then
    v_to_name := nullif(btrim(p_to_account_name), '');
    if v_to_name is null or char_length(v_to_name) > 100 then
      raise exception 'Enter a valid external recipient.';
    end if;
  else
    select name into v_to_name from accounts
      where id = p_to_account_id and workspace_id = p_workspace_id;
    if v_to_name is null then
      raise exception 'Select a valid destination account.';
    end if;
  end if;

  if p_from_account_id is not null and p_from_account_id = p_to_account_id then
    raise exception 'Choose two different accounts.';
  end if;

  insert into categories (workspace_id, type, name)
    values (p_workspace_id, 'transfer', 'Transfer')
    on conflict (workspace_id, type, name) do update set name = excluded.name
    returning id into v_category_id;

  insert into merchants (workspace_id, name)
    values (p_workspace_id, 'Transfer')
    on conflict (workspace_id, name) do update set name = excluded.name
    returning id into v_merchant_id;

  if p_from_account_id is not null then
    insert into transactions (workspace_id, user_id, account_id, category_id, merchant_id, notes, amount, date, status)
      values (p_workspace_id, v_user_id, p_from_account_id, v_category_id, v_merchant_id,
              coalesce(nullif(p_notes, ''), 'Transfer to ' || v_to_name), -p_amount, p_date, 'cleared')
      returning id into v_from_tx;
  end if;

  if p_to_account_id is not null then
    insert into transactions (workspace_id, user_id, account_id, category_id, merchant_id, notes, amount, date, status)
      values (p_workspace_id, v_user_id, p_to_account_id, v_category_id, v_merchant_id,
              coalesce(nullif(p_notes, ''), 'Transfer from ' || v_from_name), p_amount, p_date, 'cleared')
      returning id into v_to_tx;
  end if;

  insert into transfers (workspace_id, user_id, from_account_id, from_account_name, to_account_id, to_account_name,
                         amount, date, notes, from_transaction_id, to_transaction_id)
    values (p_workspace_id, v_user_id, p_from_account_id,
            case when p_from_account_id is null then v_from_name else null end,
            p_to_account_id, case when p_to_account_id is null then v_to_name else null end,
            p_amount, p_date, nullif(p_notes, ''), v_from_tx, v_to_tx)
    returning id into v_transfer_id;

  return v_transfer_id;
end;
$$;

create function public.update_transfer(
  p_transfer_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_date date,
  p_notes text,
  p_to_account_name text,
  p_from_account_name text
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_transfer transfers%rowtype;
  v_from_name text;
  v_to_name text;
  v_category_id uuid;
  v_merchant_id uuid;
  v_from_tx uuid;
  v_to_tx uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to update a transfer.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero.';
  end if;
  if p_from_account_id is null and p_to_account_id is null then
    raise exception 'A transfer must include one of your accounts.';
  end if;

  select * into v_transfer from transfers where id = p_transfer_id for update;
  if not found then
    raise exception 'Transfer not found.';
  end if;
  if v_transfer.user_id <> auth.uid() then
    raise exception 'You don''t have permission to update this transfer.';
  end if;
  if v_transfer.from_transaction_id is null and v_transfer.to_transaction_id is null then
    raise exception 'This transfer is missing its ledger entries and can''t be edited here.';
  end if;

  if p_from_account_id is null then
    v_from_name := nullif(btrim(p_from_account_name), '');
    if v_from_name is null or char_length(v_from_name) > 100 then
      raise exception 'Enter a valid external source.';
    end if;
  else
    select name into v_from_name from accounts
      where id = p_from_account_id and workspace_id = v_transfer.workspace_id;
    if v_from_name is null then
      raise exception 'Select a valid source account.';
    end if;
  end if;

  if p_to_account_id is null then
    v_to_name := nullif(btrim(p_to_account_name), '');
    if v_to_name is null or char_length(v_to_name) > 100 then
      raise exception 'Enter a valid external recipient.';
    end if;
  else
    select name into v_to_name from accounts
      where id = p_to_account_id and workspace_id = v_transfer.workspace_id;
    if v_to_name is null then
      raise exception 'Select a valid destination account.';
    end if;
  end if;

  if p_from_account_id is not null and p_from_account_id = p_to_account_id then
    raise exception 'Choose two different accounts.';
  end if;

  select category_id, merchant_id into v_category_id, v_merchant_id from transactions
    where id = coalesce(v_transfer.from_transaction_id, v_transfer.to_transaction_id)
      and workspace_id = v_transfer.workspace_id;

  if p_from_account_id is null then
    if v_transfer.from_transaction_id is not null then
      delete from transactions where id = v_transfer.from_transaction_id;
    end if;
    v_from_tx := null;
  elsif v_transfer.from_transaction_id is null then
    insert into transactions (workspace_id, user_id, account_id, category_id, merchant_id, notes, amount, date, status)
      values (v_transfer.workspace_id, v_transfer.user_id, p_from_account_id, v_category_id, v_merchant_id,
              coalesce(nullif(p_notes, ''), 'Transfer to ' || v_to_name), -p_amount, p_date, 'cleared')
      returning id into v_from_tx;
  else
    update transactions
      set account_id = p_from_account_id, amount = -p_amount, date = p_date,
          notes = coalesce(nullif(p_notes, ''), 'Transfer to ' || v_to_name)
      where id = v_transfer.from_transaction_id;
    v_from_tx := v_transfer.from_transaction_id;
  end if;

  if p_to_account_id is null then
    if v_transfer.to_transaction_id is not null then
      delete from transactions where id = v_transfer.to_transaction_id;
    end if;
    v_to_tx := null;
  elsif v_transfer.to_transaction_id is null then
    insert into transactions (workspace_id, user_id, account_id, category_id, merchant_id, notes, amount, date, status)
      values (v_transfer.workspace_id, v_transfer.user_id, p_to_account_id, v_category_id, v_merchant_id,
              coalesce(nullif(p_notes, ''), 'Transfer from ' || v_from_name), p_amount, p_date, 'cleared')
      returning id into v_to_tx;
  else
    update transactions
      set account_id = p_to_account_id, amount = p_amount, date = p_date,
          notes = coalesce(nullif(p_notes, ''), 'Transfer from ' || v_from_name)
      where id = v_transfer.to_transaction_id;
    v_to_tx := v_transfer.to_transaction_id;
  end if;

  update transfers
    set from_account_id = p_from_account_id,
        from_account_name = case when p_from_account_id is null then v_from_name else null end,
        to_account_id = p_to_account_id,
        to_account_name = case when p_to_account_id is null then v_to_name else null end,
        amount = p_amount, date = p_date, notes = nullif(p_notes, ''),
        from_transaction_id = v_from_tx, to_transaction_id = v_to_tx
    where id = p_transfer_id;
end;
$$;

revoke execute on function public.create_transfer(uuid, uuid, uuid, numeric, date, text, text, text) from public, anon;
revoke execute on function public.update_transfer(uuid, uuid, uuid, numeric, date, text, text, text) from public, anon;
grant execute on function public.create_transfer(uuid, uuid, uuid, numeric, date, text, text, text) to authenticated;
grant execute on function public.update_transfer(uuid, uuid, uuid, numeric, date, text, text, text) to authenticated;