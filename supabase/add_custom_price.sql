-- Run ONCE in the Supabase SQL Editor BEFORE deploying the custom sale price update.
-- Lets Record a Sale use a different price (discount / wholesale) without changing the product's selling price.
-- The price used is saved on the sale (sales.unit_price), so Total Sales and Sales Profit follow it automatically.
drop function if exists public.record_sale(uuid, integer, text);
create or replace function public.record_sale(p_id uuid, p_qty integer, p_method text, p_price numeric default null) returns void language plpgsql as $$
declare p public.products; nq integer; pr numeric(12,2);
begin
  if p_qty is null or p_qty <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_method not in ('cash','gcash','gotyme','maribank','other') then raise exception 'Invalid payment method'; end if;
  if p_price is not null and p_price < 0 then raise exception 'Price cannot be negative'; end if;
  select * into p from public.products where id = p_id and deleted_at is null for update;
  if not found then raise exception 'Product not found'; end if;
  if p_qty > p.quantity then raise exception 'Cannot sell more than the available stock (%)', p.quantity; end if;
  pr := round(coalesce(p_price, p.selling_price), 2);
  nq := p.quantity - p_qty;
  update public.products set quantity = nq, sold_quantity = sold_quantity + p_qty where id = p_id;
  insert into public.sales (product_id, product_name, quantity, unit_price, unit_cost, total, payment_method)
  values (p_id, p.item_name, p_qty, pr, p.unit_cost, pr * p_qty, p_method);
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p_id, p.item_name, 'sale_recorded',
    format('Sold %s unit%s via %s%s (%s → %s)', p_qty, case when p_qty = 1 then '' else 's' end,
      case p_method when 'gcash' then 'GCash' when 'gotyme' then 'Gotyme' when 'maribank' then 'Maribank' else initcap(p_method) end,
      case when pr <> p.selling_price then format(' at ₱%s each (regular ₱%s)', to_char(pr, 'FM999,999,990.00'), to_char(p.selling_price, 'FM999,999,990.00')) else '' end,
      p.quantity, nq), -p_qty);
end $$;
revoke execute on function public.record_sale(uuid, integer, text, numeric) from public, anon;
grant execute on function public.record_sale(uuid, integer, text, numeric) to authenticated;

-- Edit Sale can now change the price too (safe to re-run). Leaving p_price out keeps the sale's current price.
drop function if exists public.edit_sale(uuid, integer, text);
create or replace function public.edit_sale(p_sale uuid, p_qty integer, p_method text, p_price numeric default null) returns void language plpgsql security definer set search_path = public as $$
declare s public.sales; p public.products; d integer; nq integer; lbl text; np numeric(12,2);
begin
  if p_qty is null or p_qty <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_method not in ('cash','gcash','gotyme','maribank','other') then raise exception 'Invalid payment method'; end if;
  if p_price is not null and p_price < 0 then raise exception 'Price cannot be negative'; end if;
  select * into s from public.sales where id = p_sale for update;
  if not found then raise exception 'Sale not found'; end if;
  if s.product_id is null then raise exception 'Sale not found'; end if;
  select * into p from public.products where id = s.product_id and deleted_at is null for update;
  if not found then raise exception 'Product not found'; end if;
  d := p_qty - s.quantity;
  if d > p.quantity then raise exception 'Cannot sell more than the available stock (%)', p.quantity + s.quantity; end if;
  nq := p.quantity - d;
  np := round(coalesce(p_price, s.unit_price), 2);
  update public.products set quantity = nq, sold_quantity = sold_quantity + d where id = p.id;
  update public.sales set quantity = p_qty, unit_price = np, total = np * p_qty, payment_method = p_method where id = s.id;
  lbl := case p_method when 'gcash' then 'GCash' when 'gotyme' then 'Gotyme' when 'maribank' then 'Maribank' else initcap(p_method) end;
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p.id, p.item_name, 'sale_edited',
    format('Sale changed: %s → %s unit%s via %s%s (stock %s → %s)', s.quantity, p_qty, case when p_qty = 1 then '' else 's' end, lbl,
      case when np <> s.unit_price then format(' at ₱%s each (was ₱%s)', to_char(np, 'FM999,999,990.00'), to_char(s.unit_price, 'FM999,999,990.00')) else '' end,
      p.quantity, nq), -d);
end $$;
revoke execute on function public.edit_sale(uuid, integer, text, numeric) from public, anon;
grant execute on function public.edit_sale(uuid, integer, text, numeric) to authenticated;
