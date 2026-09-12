alter table public.transactions
  drop column if exists merchant,
  drop column if exists category;
