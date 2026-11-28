-- Failed receipt scans no longer use up the daily quota, so retrying a scan
-- that timed out or couldn't be read is free.
--
-- Two caps per user, both over a rolling 24h:
--   * the quota: 30 scans that are pending or succeeded. Pending counts so a
--     burst of concurrent requests can't all pass before any of them finishes;
--   * a backstop: 100 attempts of any status. Failed scans still call the
--     rate-limited extractor, so they can't be unlimited.

create or replace function public.start_receipt_scan(
  p_workspace_id uuid,
  p_receipt_path text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c_daily_scan_limit constant int := 30;
  c_daily_attempt_limit constant int := 100;
  v_user_id uuid := auth.uid();
  v_counted int;
  v_attempts int;
  v_scan_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to scan a receipt.';
  end if;
  if not (public.is_workspace_member(p_workspace_id) or public.is_workspace_owner(p_workspace_id)) then
    raise exception 'You don''t have access to this workspace.';
  end if;
  if p_receipt_path is null or p_receipt_path not like p_workspace_id::text || '/%' then
    raise exception 'Invalid receipt path.';
  end if;

  -- Serialise concurrent scans per user so two requests can't both pass the count.
  perform pg_advisory_xact_lock(hashtext('receipt_scans:' || v_user_id::text));

  select
    count(*) filter (where status <> 'failed'),
    count(*)
  into v_counted, v_attempts
  from receipt_scans
  where user_id = v_user_id and created_at > now() - interval '24 hours';

  if v_counted >= c_daily_scan_limit then
    raise exception 'Daily receipt scan limit reached (%). Try again later.', c_daily_scan_limit;
  end if;
  if v_attempts >= c_daily_attempt_limit then
    raise exception 'Too many receipt scan attempts today. Try again later.';
  end if;

  insert into receipt_scans (workspace_id, user_id, receipt_path)
    values (p_workspace_id, v_user_id, p_receipt_path)
    returning id into v_scan_id;

  return v_scan_id;
end;
$$;

revoke execute on function public.start_receipt_scan(uuid, text) from public, anon;
grant execute on function public.start_receipt_scan(uuid, text) to authenticated;
