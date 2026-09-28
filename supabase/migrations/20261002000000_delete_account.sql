-- Self-service account deletion. Removing an auth.users row needs a privileged
-- role, so this is security definer; it only ever acts on auth.uid(), never on
-- a caller-supplied id, so no service-role key is needed in app code.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Sign in to delete your account.';
  end if;

  -- Cascading from auth.users would silently remove this user's rows from
  -- ledgers other people rely on, or their ledger from under its members.
  -- Refuse until workspace hand-over exists.
  if exists (
    select 1
    from public.workspace_members m
    join public.workspaces w on w.id = m.workspace_id
    where m.user_id <> w.owner_id
      and (w.owner_id = v_user_id or m.user_id = v_user_id)
  ) then
    raise exception 'You share a workspace with other people. Remove them or leave it before deleting your account.';
  end if;

  -- transfers -> accounts is ON DELETE RESTRICT, which is checked immediately,
  -- so the workspace cascade fails on any workspace with transfers unless they
  -- go first.
  delete from public.transfers t
  using public.workspaces w
  where w.id = t.workspace_id and w.owner_id = v_user_id;

  delete from public.workspaces where owner_id = v_user_id;
  delete from auth.users where id = v_user_id;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
