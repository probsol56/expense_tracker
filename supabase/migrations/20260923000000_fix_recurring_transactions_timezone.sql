-- generate_recurring_transactions() used current_date, which resolves in the
-- session's TimeZone setting (UTC on Supabase). The cron job fires at 18:00
-- UTC specifically so it lands at midnight Asia/Dhaka, but at that instant
-- current_date is still the UTC day that's ending, one calendar day behind
-- Dhaka's clock. Pin "today" to Asia/Dhaka explicitly instead.
create or replace function public.generate_recurring_transactions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  today date := (now() at time zone 'Asia/Dhaka')::date;
begin
  for rec in
    select *
    from public.recurring_transactions
    where is_active
      and start_date <= today
      and (end_date is null or end_date >= today)
      and (last_generated_date is null or last_generated_date < today)
  loop
    if public.is_recurring_transaction_due(rec.frequency, rec.weekdays, rec.day_of_month, today)
      and not (
        rec.skip_holidays
        and exists (
          select 1 from public.holidays h
          where h.workspace_id = rec.workspace_id and h.date = today
        )
      )
    then
      insert into public.transactions (
        workspace_id, user_id, account_id, category_id, merchant_id,
        amount, date, status, notes
      ) values (
        rec.workspace_id, rec.user_id, rec.account_id, rec.category_id, rec.merchant_id,
        case rec.type when 'income' then rec.amount else -rec.amount end,
        today, 'cleared', rec.description
      );
    end if;

    update public.recurring_transactions set last_generated_date = today where id = rec.id;
  end loop;
end;
$$;
