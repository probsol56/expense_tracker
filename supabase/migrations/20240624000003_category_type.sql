alter table public.categories add column if not exists type text;

update public.categories set type = 'expense' where type is null;

alter table public.categories alter column type set default 'expense';
alter table public.categories alter column type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.categories'::regclass
      and conname = 'categories_type_check'
  ) then
    alter table public.categories add constraint categories_type_check check (type in ('expense', 'income')) not valid;
  end if;
end $$;

alter table public.categories validate constraint categories_type_check;

alter table public.categories drop constraint if exists categories_workspace_id_name_key;
drop index if exists public.categories_workspace_id_name_key;
create unique index if not exists categories_workspace_type_name_unique on public.categories (workspace_id, type, name);
