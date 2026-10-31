begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

insert into auth.users (id, email)
values ('cccccccc-0000-0000-0000-000000000001', 'category-owner@test.local');

insert into public.workspaces (id, name, owner_id)
values ('cccccccc-1111-0000-0000-000000000001', 'Category workspace', 'cccccccc-0000-0000-0000-000000000001');

insert into public.categories (id, workspace_id, name, type)
values ('cccccccc-2222-0000-0000-000000000001', 'cccccccc-1111-0000-0000-000000000001', 'Used category', 'expense');

insert into public.transactions (workspace_id, user_id, category_id, amount)
values ('cccccccc-1111-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'cccccccc-2222-0000-0000-000000000001', -25);

set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-000000000001","role":"authenticated"}';

select throws_ok(
  $$delete from public.categories where id = 'cccccccc-2222-0000-0000-000000000001'$$,
  '23503', null, 'a category used by a transaction cannot be deleted'
);
select is(
  (select count(*)::int from public.categories where id = 'cccccccc-2222-0000-0000-000000000001'),
  1, 'a category with a related transaction remains'
);

select * from finish();
rollback;
