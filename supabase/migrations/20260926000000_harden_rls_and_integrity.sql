-- Closes three holes reachable by calling PostgREST directly with the anon
-- key, bypassing the server actions' app-level checks:
--   1. "user transfers" compared m.workspace_id to itself (the unqualified
--      workspace_id bound to the subquery's alias), so any workspace member
--      could read/write every transfer in the database.
--   2. transactions' update WITH CHECK accepted user_id = auth.uid() alone,
--      letting a user move their own row into any workspace.
--   3. Nothing tied a row's foreign keys to its own workspace, so a
--      transaction could point at another workspace's account — and the
--      security definer balance trigger would then rewrite that account's
--      balance. Composite (id, workspace_id) FKs now enforce it declaratively.
-- Requires Postgres 15+ for ON DELETE SET NULL (column).

-- ---------------------------------------------------------------------------
-- Pre-flight: refuse to run against data the new constraints would reject.
-- Financial rows are not auto-repaired; fix them by hand, then re-run.
-- ---------------------------------------------------------------------------
do $$
declare
  v_report text;
begin
  select string_agg(format('%s: %s row(s)', label, bad), E'\n')
  into v_report
  from (
    select 'transactions.workspace_id is null' as label, count(*) as bad
      from public.transactions where workspace_id is null
    union all select 'transactions.account_id', count(*)
      from public.transactions c join public.accounts p on p.id = c.account_id where p.workspace_id <> c.workspace_id
    union all select 'transactions.category_id', count(*)
      from public.transactions c join public.categories p on p.id = c.category_id where p.workspace_id <> c.workspace_id
    union all select 'transactions.merchant_id', count(*)
      from public.transactions c join public.merchants p on p.id = c.merchant_id where p.workspace_id <> c.workspace_id
    union all select 'transactions.loan_id', count(*)
      from public.transactions c join public.loans p on p.id = c.loan_id where p.workspace_id <> c.workspace_id
    union all select 'loans.transaction_id', count(*)
      from public.loans c join public.transactions p on p.id = c.transaction_id where p.workspace_id <> c.workspace_id
    union all select 'loan_payments.loan_id', count(*)
      from public.loan_payments c join public.loans p on p.id = c.loan_id where p.workspace_id <> c.workspace_id
    union all select 'loan_payments.transaction_id', count(*)
      from public.loan_payments c join public.transactions p on p.id = c.transaction_id where p.workspace_id <> c.workspace_id
    union all select 'recurring_transactions.account_id', count(*)
      from public.recurring_transactions c join public.accounts p on p.id = c.account_id where p.workspace_id <> c.workspace_id
    union all select 'recurring_transactions.category_id', count(*)
      from public.recurring_transactions c join public.categories p on p.id = c.category_id where p.workspace_id <> c.workspace_id
    union all select 'recurring_transactions.merchant_id', count(*)
      from public.recurring_transactions c join public.merchants p on p.id = c.merchant_id where p.workspace_id <> c.workspace_id
    union all select 'transfers.from_account_id', count(*)
      from public.transfers c join public.accounts p on p.id = c.from_account_id where p.workspace_id <> c.workspace_id
    union all select 'transfers.to_account_id', count(*)
      from public.transfers c join public.accounts p on p.id = c.to_account_id where p.workspace_id <> c.workspace_id
    union all select 'transfers.from_transaction_id', count(*)
      from public.transfers c join public.transactions p on p.id = c.from_transaction_id where p.workspace_id <> c.workspace_id
    union all select 'transfers.to_transaction_id', count(*)
      from public.transfers c join public.transactions p on p.id = c.to_transaction_id where p.workspace_id <> c.workspace_id
    union all select 'bank_transactions.bank_account_id', count(*)
      from public.bank_transactions c join public.bank_accounts p on p.id = c.bank_account_id where p.workspace_id <> c.workspace_id
    union all select 'bank_transactions.category_id', count(*)
      from public.bank_transactions c join public.categories p on p.id = c.category_id where p.workspace_id <> c.workspace_id
    union all select 'import_batches.bank_account_id', count(*)
      from public.import_batches c join public.bank_accounts p on p.id = c.bank_account_id where p.workspace_id <> c.workspace_id
  ) checks
  where bad > 0;

  if v_report is not null then
    raise exception using
      message = 'Rows reference another workspace; fix them before applying this migration.',
      detail = v_report;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Workspace integrity: every reference must stay inside the row's workspace.
-- Composite FKs replace the single-column ones under the same names, so
-- PostgREST embeds (merchant:merchants(name), categories!inner) still resolve
-- to exactly one relationship. ON DELETE behaviour is unchanged.
-- ---------------------------------------------------------------------------
alter table public.transactions alter column workspace_id set not null;

alter table public.accounts      add constraint accounts_id_workspace_id_key      unique (id, workspace_id);
alter table public.categories    add constraint categories_id_workspace_id_key    unique (id, workspace_id);
alter table public.merchants     add constraint merchants_id_workspace_id_key     unique (id, workspace_id);
alter table public.loans         add constraint loans_id_workspace_id_key         unique (id, workspace_id);
alter table public.transactions  add constraint transactions_id_workspace_id_key  unique (id, workspace_id);
alter table public.bank_accounts add constraint bank_accounts_id_workspace_id_key unique (id, workspace_id);

alter table public.transactions
  drop constraint if exists transactions_account_id_fkey,
  drop constraint if exists transactions_category_id_fkey,
  drop constraint if exists transactions_merchant_id_fkey,
  drop constraint if exists transactions_loan_id_fkey,
  add constraint transactions_account_id_fkey foreign key (account_id, workspace_id)
    references public.accounts (id, workspace_id) on delete set null (account_id),
  add constraint transactions_category_id_fkey foreign key (category_id, workspace_id)
    references public.categories (id, workspace_id) on delete set null (category_id),
  add constraint transactions_merchant_id_fkey foreign key (merchant_id, workspace_id)
    references public.merchants (id, workspace_id) on delete set null (merchant_id),
  add constraint transactions_loan_id_fkey foreign key (loan_id, workspace_id)
    references public.loans (id, workspace_id) on delete set null (loan_id);

alter table public.loans
  drop constraint if exists loans_transaction_id_fkey,
  add constraint loans_transaction_id_fkey foreign key (transaction_id, workspace_id)
    references public.transactions (id, workspace_id) on delete set null (transaction_id);

alter table public.loan_payments
  drop constraint if exists loan_payments_loan_id_fkey,
  drop constraint if exists loan_payments_transaction_id_fkey,
  add constraint loan_payments_loan_id_fkey foreign key (loan_id, workspace_id)
    references public.loans (id, workspace_id) on delete cascade,
  add constraint loan_payments_transaction_id_fkey foreign key (transaction_id, workspace_id)
    references public.transactions (id, workspace_id) on delete set null (transaction_id);

alter table public.recurring_transactions
  drop constraint if exists recurring_transactions_account_id_fkey,
  drop constraint if exists recurring_transactions_category_id_fkey,
  drop constraint if exists recurring_transactions_merchant_id_fkey,
  add constraint recurring_transactions_account_id_fkey foreign key (account_id, workspace_id)
    references public.accounts (id, workspace_id) on delete cascade,
  add constraint recurring_transactions_category_id_fkey foreign key (category_id, workspace_id)
    references public.categories (id, workspace_id) on delete set null (category_id),
  add constraint recurring_transactions_merchant_id_fkey foreign key (merchant_id, workspace_id)
    references public.merchants (id, workspace_id) on delete set null (merchant_id);

alter table public.transfers
  drop constraint if exists transfers_from_account_id_fkey,
  drop constraint if exists transfers_to_account_id_fkey,
  drop constraint if exists transfers_from_transaction_id_fkey,
  drop constraint if exists transfers_to_transaction_id_fkey,
  add constraint transfers_from_account_id_fkey foreign key (from_account_id, workspace_id)
    references public.accounts (id, workspace_id) on delete restrict,
  add constraint transfers_to_account_id_fkey foreign key (to_account_id, workspace_id)
    references public.accounts (id, workspace_id) on delete restrict,
  add constraint transfers_from_transaction_id_fkey foreign key (from_transaction_id, workspace_id)
    references public.transactions (id, workspace_id) on delete set null (from_transaction_id),
  add constraint transfers_to_transaction_id_fkey foreign key (to_transaction_id, workspace_id)
    references public.transactions (id, workspace_id) on delete set null (to_transaction_id);

alter table public.bank_transactions
  drop constraint if exists bank_transactions_bank_account_id_fkey,
  drop constraint if exists bank_transactions_category_id_fkey,
  add constraint bank_transactions_bank_account_id_fkey foreign key (bank_account_id, workspace_id)
    references public.bank_accounts (id, workspace_id) on delete cascade,
  add constraint bank_transactions_category_id_fkey foreign key (category_id, workspace_id)
    references public.categories (id, workspace_id) on delete set null (category_id);

alter table public.import_batches
  drop constraint if exists import_batches_bank_account_id_fkey,
  add constraint import_batches_bank_account_id_fkey foreign key (bank_account_id, workspace_id)
    references public.bank_accounts (id, workspace_id) on delete set null (bank_account_id);

-- ---------------------------------------------------------------------------
-- RLS: access follows current workspace membership only. The old
-- `or user_id = auth.uid()` escape let removed members keep reading and
-- editing rows in workspaces they no longer belong to.
-- ---------------------------------------------------------------------------
drop policy if exists "user transfers" on public.transfers;
create policy "members can view transfers" on public.transfers for select
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "members can add transfers" on public.transfers for insert
  with check (user_id = auth.uid() and (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)));
create policy "members can update transfers" on public.transfers for update
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "members can delete transfers" on public.transfers for delete
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));

drop policy if exists "members can view transactions" on public.transactions;
drop policy if exists "members can update transactions" on public.transactions;
drop policy if exists "members can delete transactions" on public.transactions;
create policy "members can view transactions" on public.transactions for select
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "members can update transactions" on public.transactions for update
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));
create policy "members can delete transactions" on public.transactions for delete
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id));

drop policy if exists "workspace transaction items access" on public.transaction_items;
create policy "workspace transaction items access" on public.transaction_items for all
  using (exists (
    select 1 from public.transactions t
    where t.id = transaction_items.transaction_id
      and (public.is_workspace_member(t.workspace_id) or public.is_workspace_owner(t.workspace_id))
  ))
  with check (exists (
    select 1 from public.transactions t
    where t.id = transaction_items.transaction_id
      and (public.is_workspace_member(t.workspace_id) or public.is_workspace_owner(t.workspace_id))
  ));

drop policy if exists "workspace loans access" on public.loans;
create policy "workspace loans access" on public.loans for all
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id))
  with check (user_id = auth.uid() and (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)));

drop policy if exists "workspace loan payments access" on public.loan_payments;
create policy "workspace loan payments access" on public.loan_payments for all
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id))
  with check (user_id = auth.uid() and (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)));

drop policy if exists "workspace recurring transactions access" on public.recurring_transactions;
create policy "workspace recurring transactions access" on public.recurring_transactions for all
  using (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id))
  with check (user_id = auth.uid() and (public.is_workspace_member(workspace_id) or public.is_workspace_owner(workspace_id)));

-- ---------------------------------------------------------------------------
-- Security definer functions: internal-only ones must not be callable via
-- /rest/v1/rpc. generate_recurring_transactions touches every workspace and
-- runs from pg_cron as postgres; the balance functions run from the trigger.
-- is_workspace_member/owner stay executable — policies call them as the user.
-- ---------------------------------------------------------------------------
revoke execute on function public.recalculate_account_balance(uuid) from public, anon, authenticated;
revoke execute on function public.transactions_sync_account_balance() from public, anon, authenticated;
revoke execute on function public.generate_recurring_transactions() from public, anon, authenticated;

notify pgrst, 'reload schema';
