-- Run ONCE in the Supabase SQL Editor (after add_sales.sql). Whole Price no longer drops when you sell.
-- Whole Price = cost of all stock received (Initial Stock x cost per item). Selling only changes Sold and Remaining.
create or replace function public.record_sale(p_id uuid, p_qty integer, p_method text) returns void language plpgsql as $$
declare p public.products; nq integer;
begin
  if p_qty is null or p_qty <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_method not in ('cash','gcash','gotyme','maribank','other') then raise exception 'Invalid payment method'; end if;
  select * into p from public.products where id = p_id for update;
  if not found then raise exception 'Product not found'; end if;
  if p_qty > p.quantity then raise exception 'Cannot sell more than the available stock (%)', p.quantity; end if;
  nq := p.quantity - p_qty;
  update public.products set quantity = nq, sold_quantity = sold_quantity + p_qty where id = p_id;
  insert into public.sales (product_id, product_name, quantity, unit_price, unit_cost, total, payment_method)
  values (p_id, p.item_name, p_qty, p.selling_price, p.unit_cost, p.selling_price * p_qty, p_method);
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p_id, p.item_name, 'sale_recorded',
    format('Sold %s unit%s via %s (%s → %s)', p_qty, case when p_qty = 1 then '' else 's' end,
      case p_method when 'gcash' then 'GCash' when 'gotyme' then 'Gotyme' when 'maribank' then 'Maribank' else initcap(p_method) end, p.quantity, nq), -p_qty);
end $$;

-- Adding/removing stock still moves Initial Stock and Whole Price together.
create or replace function public.adjust_stock(p_id uuid, p_delta integer) returns void language plpgsql as $$
declare p public.products; nq integer;
begin
  if p_delta = 0 then raise exception 'Quantity cannot be zero'; end if;
  select * into p from public.products where id = p_id for update;
  if not found then raise exception 'Product not found'; end if;
  nq := p.quantity + p_delta;
  if nq < 0 then raise exception 'Cannot remove more than the current quantity (%)', p.quantity; end if;
  update public.products set quantity = nq, whole_price = round(unit_cost * (nq + sold_quantity), 2) where id = p_id;
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p_id, p.item_name, case when p_delta > 0 then 'stock_added' else 'stock_removed' end,
    format('%s %s unit%s (%s → %s)', case when p_delta > 0 then 'Added' else 'Removed' end, abs(p_delta), case when abs(p_delta) = 1 then '' else 's' end, p.quantity, nq), p_delta);
end $$;

-- Repair products that already had sales recorded with the old behavior.
update public.products set whole_price = round(unit_cost * (quantity + sold_quantity), 2) where sold_quantity > 0;
