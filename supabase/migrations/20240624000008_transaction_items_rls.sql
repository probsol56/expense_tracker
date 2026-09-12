alter table public.transaction_items enable row level security;

drop policy if exists "workspace transaction items access" on public.transaction_items;

create policy "workspace transaction items access"
  on public.transaction_items
  for all
  using (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_items.transaction_id
        and (
          t.user_id = auth.uid()
          or public.is_workspace_member(t.workspace_id)
          or public.is_workspace_owner(t.workspace_id)
        )
    )
  )
  with check (
    exists (
      select 1
      from public.transactions t
      where t.id = transaction_items.transaction_id
        and (
          t.user_id = auth.uid()
          or public.is_workspace_member(t.workspace_id)
          or public.is_workspace_owner(t.workspace_id)
        )
    )
  );
