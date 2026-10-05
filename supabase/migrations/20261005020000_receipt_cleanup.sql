-- Receipt files outlive their transactions in three ways: a scan the user
-- never saved, a receipt removed or replaced on edit, and a workspace deleted
-- with its account. All three leave a storage object that no transaction
-- references, so one sweep covers them.
--
-- Objects must be deleted through the Storage API — deleting storage.objects
-- rows leaves the file itself in the bucket — so the sweep is the
-- cleanup-receipts Edge Function. This migration gives it the orphan list and
-- schedules it.

create index if not exists transactions_receipt_path_idx
  on public.transactions(receipt_path)
  where receipt_path is not null;

-- The grace period keeps a receipt the user has uploaded but not yet saved.
create or replace function public.list_orphaned_receipts(p_limit integer)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'receipts'
    and o.created_at < now() - interval '24 hours'
    and not exists (
      select 1 from public.transactions t where t.receipt_path = o.name
    )
  order by o.created_at
  limit least(greatest(p_limit, 1), 1000);
$$;

revoke execute on function public.list_orphaned_receipts(integer) from public, anon, authenticated;
grant execute on function public.list_orphaned_receipts(integer) to service_role;

-- The daily cap only reads the last 24 hours; older rows are kept a while
-- for troubleshooting, then dropped so the table doesn't grow forever.
create or replace function public.prune_receipt_scans()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.receipt_scans where created_at < now() - interval '30 days';
$$;

revoke execute on function public.prune_receipt_scans() from public, anon, authenticated;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'prune-receipt-scans',
  '30 20 * * *',
  $$select public.prune_receipt_scans();$$
);

-- 20:00 UTC = 02:00 Asia/Dhaka. Reads two Vault secrets, created once per
-- environment (never committed):
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret('<random secret>', 'receipt_cleanup_secret');
-- The same secret is set on the function: supabase secrets set RECEIPT_CLEANUP_SECRET=...
-- Until both exist the job's request fails and nothing is deleted.
select cron.schedule(
  'cleanup-receipts',
  '0 20 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/cleanup-receipts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cleanup-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'receipt_cleanup_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
