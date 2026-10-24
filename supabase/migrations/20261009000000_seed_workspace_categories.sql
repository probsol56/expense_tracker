insert into public.categories (workspace_id, name, type, color)
select workspaces.id, defaults.name, defaults.type, defaults.color
from public.workspaces
cross join (
  values
    ('Groceries', 'expense', '#ef6f6c'),
    ('Dining & Food', 'expense', '#ef6f6c'),
    ('Transport & Fuel', 'expense', '#ef6f6c'),
    ('Entertainment & Subscriptions', 'expense', '#ef6f6c'),
    ('Housing & Utilities', 'expense', '#ef6f6c'),
    ('Shopping', 'expense', '#ef6f6c'),
    ('Health & Wellness', 'expense', '#ef6f6c'),
    ('Bills & Utilities', 'expense', '#ef6f6c'),
    ('Travel', 'expense', '#ef6f6c'),
    ('Other Expense', 'expense', '#ef6f6c'),
    ('Salary', 'income', '#10b981'),
    ('Freelance Income', 'income', '#10b981'),
    ('Business Income', 'income', '#10b981'),
    ('Investment Return', 'income', '#10b981'),
    ('Gift & Bonus', 'income', '#10b981'),
    ('Other Income', 'income', '#10b981'),
    ('Personal Loan', 'loan', '#f59e0b'),
    ('Student Loan', 'loan', '#f59e0b'),
    ('Mortgage', 'loan', '#f59e0b'),
    ('Car Loan', 'loan', '#f59e0b'),
    ('Business Loan', 'loan', '#f59e0b'),
    ('Emergency Loan', 'loan', '#f59e0b'),
    ('Other Loan', 'loan', '#f59e0b')
) as defaults(name, type, color)
on conflict (workspace_id, type, name) do nothing;

create function public.seed_workspace_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (workspace_id, name, type, color)
  values
    (new.id, 'Groceries', 'expense', '#ef6f6c'),
    (new.id, 'Dining & Food', 'expense', '#ef6f6c'),
    (new.id, 'Transport & Fuel', 'expense', '#ef6f6c'),
    (new.id, 'Entertainment & Subscriptions', 'expense', '#ef6f6c'),
    (new.id, 'Housing & Utilities', 'expense', '#ef6f6c'),
    (new.id, 'Shopping', 'expense', '#ef6f6c'),
    (new.id, 'Health & Wellness', 'expense', '#ef6f6c'),
    (new.id, 'Bills & Utilities', 'expense', '#ef6f6c'),
    (new.id, 'Travel', 'expense', '#ef6f6c'),
    (new.id, 'Other Expense', 'expense', '#ef6f6c'),
    (new.id, 'Salary', 'income', '#10b981'),
    (new.id, 'Freelance Income', 'income', '#10b981'),
    (new.id, 'Business Income', 'income', '#10b981'),
    (new.id, 'Investment Return', 'income', '#10b981'),
    (new.id, 'Gift & Bonus', 'income', '#10b981'),
    (new.id, 'Other Income', 'income', '#10b981'),
    (new.id, 'Personal Loan', 'loan', '#f59e0b'),
    (new.id, 'Student Loan', 'loan', '#f59e0b'),
    (new.id, 'Mortgage', 'loan', '#f59e0b'),
    (new.id, 'Car Loan', 'loan', '#f59e0b'),
    (new.id, 'Business Loan', 'loan', '#f59e0b'),
    (new.id, 'Emergency Loan', 'loan', '#f59e0b'),
    (new.id, 'Other Loan', 'loan', '#f59e0b')
  on conflict (workspace_id, type, name) do nothing;
  return new;
end;
$$;

create trigger seed_workspace_categories_after_insert
after insert on public.workspaces
for each row execute function public.seed_workspace_categories();
