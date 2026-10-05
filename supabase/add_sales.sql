-- Run ONCE in the Supabase SQL Editor BEFORE deploying the Sales update.
-- 1) Payment methods on products become: Cash, GCash, Gotyme, Maribank, Other (old Maya/Bank/Card values become Other).
alter table public.products drop constraint if exists products_payment_mode_check;
update public.products set payment_mode = 'other' where payment_mode in ('maya','bank','card');
alter table public.products add constraint products_payment_mode_check check (payment_mode in ('cash','gcash','gotyme','maribank','other'));
-- 2) Sold counter (Initial Stock = remaining + sold, so it is always consistent).
alter table public.products add column if not exists sold_quantity integer not null default 0 check (sold_quantity >= 0);
-- 3) New history type.
alter table public.inventory_history drop constraint if exists inventory_history_activity_type_check;
alter table public.inventory_history add constraint inventory_history_activity_type_check check (activity_type in ('product_added','stock_added','stock_removed','product_edited','selling_price_changed','received_status_changed','product_deleted','sale_recorded'));
-- 4) Sales table.
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(14,4) not null default 0,
  total numeric(14,2) not null default 0,
  payment_method text not null check (payment_method in ('cash','gcash','gotyme','maribank','other')),
  created_at timestamptz not null default now()
);
create index if not exists sales_created_at_idx on public.sales (created_at desc);
alter table public.sales enable row level security;
drop policy if exists "sales: read" on public.sales; drop policy if exists "sales: insert" on public.sales;
create policy "sales: read" on public.sales for select to anon, authenticated using (true);
create policy "sales: insert" on public.sales for insert to anon, authenticated with check (true);
-- 5) Record a sale atomically: checks stock, deducts it, saves the sale and the history entry.
create or replace function public.record_sale(p_id uuid, p_qty integer, p_method text) returns void language plpgsql as $$
declare p public.products; nq integer;
begin
  if p_qty is null or p_qty <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if p_method not in ('cash','gcash','gotyme','maribank','other') then raise exception 'Invalid payment method'; end if;
  select * into p from public.products where id = p_id for update;
  if not found then raise exception 'Product not found'; end if;
  if p_qty > p.quantity then raise exception 'Cannot sell more than the available stock (%)', p.quantity; end if;
  nq := p.quantity - p_qty;
  update public.products set quantity = nq, sold_quantity = sold_quantity + p_qty, whole_price = round(unit_cost * nq, 2) where id = p_id;
  insert into public.sales (product_id, product_name, quantity, unit_price, unit_cost, total, payment_method)
  values (p_id, p.item_name, p_qty, p.selling_price, p.unit_cost, p.selling_price * p_qty, p_method);
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p_id, p.item_name, 'sale_recorded',
    format('Sold %s unit%s via %s (%s → %s)', p_qty, case when p_qty = 1 then '' else 's' end,
      case p_method when 'gcash' then 'GCash' when 'gotyme' then 'Gotyme' when 'maribank' then 'Maribank' else initcap(p_method) end, p.quantity, nq), -p_qty);
end $$;
-- 6) Totals for the Dashboard (no row limit).
create or replace function public.sales_summary() returns table (units bigint, revenue numeric, profit numeric) language sql stable as $$
  select coalesce(sum(quantity),0), coalesce(sum(total),0), coalesce(sum((unit_price - unit_cost) * quantity),0) from public.sales $$;
