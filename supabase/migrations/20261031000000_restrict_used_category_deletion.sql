alter table public.transactions
  drop constraint if exists transactions_category_id_fkey,
  add constraint transactions_category_id_fkey
    foreign key (category_id, workspace_id)
    references public.categories (id, workspace_id)
    on delete restrict;
