-- Run ONCE in the Supabase SQL Editor (replaces fix_delete_sales.sql; safe if you already ran that one).
-- Deleting a product now MOVES IT TO "RECENTLY DELETED" so it can be restored.
-- Its sales are hidden from Units Sold / Total Sales / Sales Profit while it is deleted, and come back if you restore it.

alter table public.products add column if not exists deleted_at timestamptz;
create index if not exists products_deleted_at_idx on public.products (deleted_at);

alter table public.inventory_history drop constraint if exists inventory_history_activity_type_check;
alter table public.inventory_history add constraint inventory_history_activity_type_check check (activity_type in ('product_added','stock_added','stock_removed','product_edited','selling_price_changed','received_status_changed','product_deleted','sale_recorded','product_restored'));

-- Delete = move to Recently Deleted.
create or replace function public.delete_product(p_id uuid) returns void language plpgsql as $$
declare p public.products;
begin
  select * into p from public.products where id = p_id and deleted_at is null;
  if not found then raise exception 'Product not found'; end if;
  update public.products set deleted_at = now() where id = p_id;
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p_id, p.item_name, 'product_deleted', format('Deleted "%s" (%s units)', p.item_name, p.quantity), -p.quantity);
end $$;

-- Restore a deleted product.
create or replace function public.restore_product(p_id uuid) returns void language plpgsql as $$
declare p public.products;
begin
  select * into p from public.products where id = p_id and deleted_at is not null;
  if not found then raise exception 'Product not found'; end if;
  update public.products set deleted_at = null where id = p_id;
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p_id, p.item_name, 'product_restored', format('Restored "%s" (%s units)', p.item_name, p.quantity), p.quantity);
end $$;

-- Delete forever (only works on products already in Recently Deleted). Also removes that product's sales.
-- SECURITY DEFINER because the sales table has no delete policy for the app user.
create or replace function public.purge_product(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.products where id = p_id and deleted_at is not null) then raise exception 'Product not found'; end if;
  delete from public.sales where product_id = p_id;
  delete from public.products where id = p_id;
end $$;

-- Dashboard totals ignore sales of deleted products (and sales left behind by older hard deletes).
create or replace function public.sales_summary() returns table (units bigint, revenue numeric, profit numeric) language sql stable as $$
  select coalesce(sum(s.quantity),0), coalesce(sum(s.total),0), coalesce(sum((s.unit_price - s.unit_cost) * s.quantity),0)
  from public.sales s join public.products p on p.id = s.product_id and p.deleted_at is null $$;

revoke execute on function public.restore_product(uuid), public.purge_product(uuid) from public, anon;
grant execute on function public.restore_product(uuid), public.purge_product(uuid) to authenticated;
