-- Receipt scanning: a receipt image/PDF is uploaded to a private bucket, read
-- by an OCR/LLM extractor in a server action, and the result pre-fills the
-- transaction form for review. The file stays attached to the transaction.
--
-- Object paths are `{workspace_id}/{file}`; storage RLS grants access by the
-- first folder segment, so a file is visible exactly to that workspace.
--
-- Every extraction call is logged in receipt_scans, which also enforces a
-- per-user cap (rolling 24h) because the extractor is a rate-limited API.

-- ---------------------------------------------------------------------------
-- Transactions: attached receipt + informational tax/discount breakdown.
-- `amount` stays the amount actually paid; these never feed balances/totals.
-- ---------------------------------------------------------------------------
alter table public.transactions
  add column receipt_path text,
  add column tax_amount numeric(12,2) check (tax_amount >= 0),
  add column discount_amount numeric(12,2) check (discount_amount >= 0),
  add constraint transactions_receipt_path_in_workspace
    check (receipt_path is null or receipt_path like workspace_id::text || '/%');

-- ---------------------------------------------------------------------------
-- Storage bucket. HEIC is converted to JPEG in the browser before upload;
-- the extractor accepts only these types.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 'receipts', false,
  10 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- The first path segment must be a workspace the caller belongs to. The regex
-- guard keeps a malformed path from raising on the uuid cast.
create or replace function public.can_access_receipt_object(p_name text)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (storage.foldername(p_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (
      public.is_workspace_member(((storage.foldername(p_name))[1])::uuid)
      or public.is_workspace_owner(((storage.foldername(p_name))[1])::uuid)
    ),
    false
  );
$$;

revoke execute on function public.can_access_receipt_object(text) from public, anon;
grant execute on function public.can_access_receipt_object(text) to authenticated;

-- No update policy: receipts are never overwritten in place.
create policy "members can view receipts" on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts' and public.can_access_receipt_object(name));
create policy "members can upload receipts" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts' and public.can_access_receipt_object(name));
create policy "members can delete receipts" on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts' and public.can_access_receipt_object(name));

-- ---------------------------------------------------------------------------
-- Scan log + daily cap. Users may read their own rows but write only through
-- the RPCs below, so the cap can't be dodged by deleting or back-dating rows.
-- ---------------------------------------------------------------------------
create table public.receipt_scans (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  receipt_path text not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  check (receipt_path like workspace_id::text || '/%')
);

create index receipt_scans_user_id_created_at_idx on public.receipt_scans(user_id, created_at desc);

alter table public.receipt_scans enable row level security;

create policy "users can view own receipt scans" on public.receipt_scans for select
  using (user_id = auth.uid());

-- Reserves one scan against the caller's quota. Failed scans still count:
-- the extractor call was made either way.
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
  v_user_id uuid := auth.uid();
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

  if (
    select count(*) from receipt_scans
    where user_id = v_user_id and created_at > now() - interval '24 hours'
  ) >= c_daily_scan_limit then
    raise exception 'Daily receipt scan limit reached (%). Try again later.', c_daily_scan_limit;
  end if;

  insert into receipt_scans (workspace_id, user_id, receipt_path)
    values (p_workspace_id, v_user_id, p_receipt_path)
    returning id into v_scan_id;

  return v_scan_id;
end;
$$;

create or replace function public.finish_receipt_scan(
  p_scan_id uuid,
  p_status text,
  p_error text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to scan a receipt.';
  end if;
  if p_status not in ('succeeded', 'failed') then
    raise exception 'Invalid scan status.';
  end if;

  update receipt_scans
    set status = p_status,
        error = left(nullif(trim(p_error), ''), 500)
    where id = p_scan_id
      and user_id = auth.uid()
      and status = 'pending';

  if not found then
    raise exception 'Receipt scan not found.';
  end if;
end;
$$;

revoke execute on function public.start_receipt_scan(uuid, text) from public, anon;
revoke execute on function public.finish_receipt_scan(uuid, text, text) from public, anon;
grant execute on function public.start_receipt_scan(uuid, text) to authenticated;
grant execute on function public.finish_receipt_scan(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
