-- Receipt objects are now named by content hash, so scanning a file that was
-- uploaded earlier reuses the existing object instead of storing a copy. That
-- object's created_at can already be past the 24h grace period, and the sweep
-- would delete it while the user is still filling in the form. A recent scan
-- of the path now counts as "in use" too.

create index if not exists receipt_scans_receipt_path_idx on public.receipt_scans(receipt_path);

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
    and not exists (
      select 1 from public.receipt_scans s
      where s.receipt_path = o.name and s.created_at > now() - interval '24 hours'
    )
  order by o.created_at
  limit least(greatest(p_limit, 1), 1000);
$$;

revoke execute on function public.list_orphaned_receipts(integer) from public, anon, authenticated;
grant execute on function public.list_orphaned_receipts(integer) to service_role;
