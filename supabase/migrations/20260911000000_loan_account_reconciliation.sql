-- Reconciles loans/repayments with account balances: both now post real
-- ledger transactions (account_id + loan_id) instead of loans/loan_payments
-- being invisible to the rest of the app, and accounts.balance becomes a
-- derived, trigger-maintained running total instead of a static number.

alter table public.accounts
  add column if not exists starting_balance numeric(12,2) not null default 0;

-- Preserve whatever balance existed before ledger-derived tracking began.
update public.accounts set starting_balance = balance;

alter table public.loans
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;

alter table public.loan_payments
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;

create index if not exists transactions_account_id_idx on public.transactions(account_id);

create or replace function public.recalculate_account_balance(p_account_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.accounts
  set balance = starting_balance + coalesce(
    (select sum(amount) from public.transactions where account_id = p_account_id),
    0
  )
  where id = p_account_id;
$$;

create or replace function public.transactions_sync_account_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.account_id is not null then
      perform public.recalculate_account_balance(old.account_id);
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.account_id is distinct from new.account_id and old.account_id is not null then
    perform public.recalculate_account_balance(old.account_id);
  end if;

  if new.account_id is not null then
    perform public.recalculate_account_balance(new.account_id);
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_balance_sync on public.transactions;
create trigger transactions_balance_sync
  after insert or update of amount, account_id or delete on public.transactions
  for each row execute function public.transactions_sync_account_balance();
