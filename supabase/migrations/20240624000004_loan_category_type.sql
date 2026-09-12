alter table public.categories drop constraint if exists categories_type_check;

alter table public.categories add constraint categories_type_check check (type in ('expense', 'income', 'loan')) not valid;

alter table public.categories validate constraint categories_type_check;
