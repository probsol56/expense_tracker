create or replace function public.delete_ledger_account(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_workspace_id uuid;
  v_transaction_count integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to delete an account.';
  end if;

  select workspace_id
  into v_workspace_id
  from public.accounts
  where id = p_account_id
  for update;

  if not found then
    raise exception 'Account not found.';
  end if;

  if not (public.is_workspace_member(v_workspace_id) or public.is_workspace_owner(v_workspace_id)) then
    raise exception 'Account not found.';
  end if;

  if exists (
    select 1 from public.transfers
    where from_account_id = p_account_id or to_account_id = p_account_id
  ) then
    raise exception 'This account is used by a transfer. Delete the transfer before deleting this account.';
  end if;

  if exists (
    select 1 from public.recurring_transactions
    where account_id = p_account_id and workspace_id = v_workspace_id
  ) then
    raise exception 'This account is used by recurring transactions. Remove or update those schedules first.';
  end if;

  select count(*)::integer
  into v_transaction_count
  from public.transactions
  where account_id = p_account_id and workspace_id = v_workspace_id;

  if v_transaction_count > 0 then
    raise exception using
      message = format(
        'This account has %s transaction%s. Delete or reassign its transactions before deleting this account.',
        v_transaction_count,
        case when v_transaction_count = 1 then '' else 's' end
      );
  end if;

  delete from public.accounts
  where id = p_account_id and workspace_id = v_workspace_id;
end;
$$;

revoke execute on function public.delete_ledger_account(uuid) from public, anon;
grant execute on function public.delete_ledger_account(uuid) to authenticated;

drop policy if exists "members can delete accounts" on public.accounts;
create policy "members can delete unused accounts" on public.accounts for delete
  using (
    (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id))
    and not exists (
      select 1 from public.transactions t
      where t.account_id = accounts.id and t.workspace_id = accounts.workspace_id
    )
    and not exists (
      select 1 from public.transfers t
      where t.from_account_id = accounts.id or t.to_account_id = accounts.id
    )
    and not exists (
      select 1 from public.recurring_transactions r
      where r.account_id = accounts.id and r.workspace_id = accounts.workspace_id
    )
  );