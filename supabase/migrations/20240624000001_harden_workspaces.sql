alter table public.workspaces add column if not exists workspace_type text not null default 'personal' check (workspace_type in ('personal','household','business'));
alter table public.workspaces add column if not exists base_currency char(3) not null default 'USD' check (base_currency ~ '^[A-Z]{3}$');

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid()); $$;
create or replace function public.is_workspace_owner(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.workspaces where id = target_workspace and owner_id = auth.uid()); $$;

drop policy if exists "members see workspaces" on public.workspaces;
drop policy if exists "owners manage workspaces" on public.workspaces;
drop policy if exists "members manage membership" on public.workspace_members;
drop policy if exists "workspace accounts" on public.accounts;
drop policy if exists "user transactions" on public.transactions;

create policy "workspace members can view" on public.workspaces for select using (owner_id = auth.uid() or public.is_workspace_member(id));
create policy "workspace owners can insert" on public.workspaces for insert with check (owner_id = auth.uid());
create policy "workspace owners can update" on public.workspaces for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "workspace owners can delete" on public.workspaces for delete using (owner_id = auth.uid());

create policy "members can view membership" on public.workspace_members for select using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "owners can add members" on public.workspace_members for insert with check (public.is_workspace_owner(workspace_id));
create policy "owners can update members" on public.workspace_members for update using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy "owners can remove members" on public.workspace_members for delete using (public.is_workspace_owner(workspace_id) or user_id = auth.uid());

create policy "members can view accounts" on public.accounts for select using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "members can manage accounts" on public.accounts for insert with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "members can update accounts" on public.accounts for update using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)) with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "members can delete accounts" on public.accounts for delete using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));

create policy "members can view transactions" on public.transactions for select using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id) or user_id = auth.uid());
create policy "members can add transactions" on public.transactions for insert with check (user_id = auth.uid() and (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)));
create policy "members can update transactions" on public.transactions for update using (user_id = auth.uid() or public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)) with check (user_id = auth.uid() or public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "members can delete transactions" on public.transactions for delete using (user_id = auth.uid() or public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
