-- Run ONCE in the Supabase SQL Editor BEFORE deploying the "edit / delete sale" update.
-- Lets you fix a wrongly recorded sale (quantity or payment method) or delete it.
-- Stock and the Sold counter are corrected automatically, and every change is written to History.

-- 1) New history types.
alter table public.inventory_history drop constraint if exists inventory_history_activity_type_check;
alter table public.inventory_history add constraint inventory_history_activity_type_check check (activity_type in ('product_added','stock_added','stock_removed','product_edited','selling_price_changed','received_status_changed','product_deleted','sale_recorded','product_restored','sale_edited','sale_deleted'));

-- 2) Edit a sale. Price stays what it was when the sale was made; only quantity and payment method change.
create or replace function public.edit_sale(p_sale uuid, p_qty integer, p_method text) returns void language plpgsql security definer set search_path = public as $$
declare s public.sales; p public.products; d integer; nq integer; lbl text;
begin
  if p_qty is null or p_qty <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_method not in ('cash','gcash','gotyme','maribank','other') then raise exception 'Invalid payment method'; end if;
  select * into s from public.sales where id = p_sale for update;
  if not found then raise exception 'Sale not found'; end if;
  if s.product_id is null then raise exception 'Sale not found'; end if;
  select * into p from public.products where id = s.product_id and deleted_at is null for update;
  if not found then raise exception 'Product not found'; end if;
  d := p_qty - s.quantity;
  if d > p.quantity then raise exception 'Cannot sell more than the available stock (%)', p.quantity + s.quantity; end if;
  nq := p.quantity - d;
  update public.products set quantity = nq, sold_quantity = sold_quantity + d where id = p.id;
  update public.sales set quantity = p_qty, total = unit_price * p_qty, payment_method = p_method where id = s.id;
  lbl := case p_method when 'gcash' then 'GCash' when 'gotyme' then 'Gotyme' when 'maribank' then 'Maribank' else initcap(p_method) end;
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p.id, p.item_name, 'sale_edited',
    format('Sale changed: %s → %s unit%s via %s (stock %s → %s)', s.quantity, p_qty, case when p_qty = 1 then '' else 's' end, lbl, p.quantity, nq), -d);
end $$;

-- 3) Delete a sale and put the units back in stock.
create or replace function public.delete_sale(p_sale uuid) returns void language plpgsql security definer set search_path = public as $$
declare s public.sales; p public.products; nq integer;
begin
  select * into s from public.sales where id = p_sale for update;
  if not found then raise exception 'Sale not found'; end if;
  if s.product_id is null then raise exception 'Sale not found'; end if;
  select * into p from public.products where id = s.product_id and deleted_at is null for update;
  if not found then raise exception 'Product not found'; end if;
  nq := p.quantity + s.quantity;
  update public.products set quantity = nq, sold_quantity = greatest(0, sold_quantity - s.quantity) where id = p.id;
  delete from public.sales where id = s.id;
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p.id, p.item_name, 'sale_deleted',
    format('Sale deleted: %s unit%s returned to stock (%s → %s)', s.quantity, case when s.quantity = 1 then '' else 's' end, p.quantity, nq), s.quantity);
end $$;

revoke execute on function public.edit_sale(uuid, integer, text), public.delete_sale(uuid) from public, anon;
grant execute on function public.edit_sale(uuid, integer, text), public.delete_sale(uuid) to authenticated;
