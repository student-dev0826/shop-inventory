-- Run ONCE in the Supabase SQL Editor BEFORE deploying the Category update.
-- Existing products keep category = NULL (shown as "Uncategorized") until you edit them and pick one.
alter table public.products add column if not exists category text;
alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check check (category is null or category in ('Shirts','Toys','Jewelries','Bags & Wallets'));
create index if not exists products_category_idx on public.products (category);
