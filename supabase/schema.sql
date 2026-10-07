-- Run this once in the Supabase dashboard: SQL Editor -> New query -> Run.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  item_name text not null check (length(trim(item_name)) > 0),
  category text check (category is null or category in ('Shirts','Toys','Jewelries','Bags & Wallets')),
  date_added date not null default current_date,
  quantity integer not null default 0 check (quantity >= 0),
  whole_price numeric(12,2) not null default 0 check (whole_price >= 0),
  selling_price numeric(12,2) not null default 0 check (selling_price >= 0),
  unit_cost numeric(14,4) not null default 0 check (unit_cost >= 0), -- cost per item; stays fixed when stock changes
  received_status text not null default 'received' check (received_status in ('received','partially_received','not_received')),
  payment_status text not null default 'not_paid' check (payment_status in ('paid','not_paid')),
  payment_mode text check (payment_mode in ('cash','gcash','maya','bank','card','other')),
  payment_reference text check (payment_reference is null or length(payment_reference) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.inventory_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null, -- history survives product deletion
  product_name text not null, -- kept so history still reads well after a product is deleted
  activity_type text not null check (activity_type in ('product_added','stock_added','stock_removed','product_edited','selling_price_changed','received_status_changed','product_deleted')),
  description text not null default '',
  quantity_change integer,
  created_at timestamptz not null default now()
);
create index on public.inventory_history (product_id);
create index on public.inventory_history (created_at desc);

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();

-- Atomic stock change: locks the row, blocks negative stock, writes the history entry.
create function public.adjust_stock(p_id uuid, p_delta integer) returns void language plpgsql as $$
declare p public.products; nq integer;
begin
  if p_delta = 0 then raise exception 'Quantity cannot be zero'; end if;
  select * into p from public.products where id = p_id for update;
  if not found then raise exception 'Product not found'; end if;
  nq := p.quantity + p_delta;
  if nq < 0 then raise exception 'Cannot remove more than the current quantity (%)', p.quantity; end if;
  update public.products set quantity = nq, whole_price = round(unit_cost * nq, 2) where id = p_id;
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p_id, p.item_name, case when p_delta > 0 then 'stock_added' else 'stock_removed' end,
    format('%s %s unit%s (%s → %s)', case when p_delta > 0 then 'Added' else 'Removed' end, abs(p_delta), case when abs(p_delta) = 1 then '' else 's' end, p.quantity, nq), p_delta);
end $$;

-- Logs the deletion, then deletes (history rows keep their name; product_id becomes null).
create function public.delete_product(p_id uuid) returns void language plpgsql as $$
declare p public.products;
begin
  select * into p from public.products where id = p_id;
  if not found then raise exception 'Product not found'; end if;
  insert into public.inventory_history (product_id, product_name, activity_type, description, quantity_change)
  values (p_id, p.item_name, 'product_deleted', format('Deleted "%s" (%s units)', p.item_name, p.quantity), -p.quantity);
  delete from public.products where id = p_id;
end $$;

-- Row Level Security. NOTE: with no login yet, anyone who has your site URL + anon key can
-- read/change this data. Add Supabase Auth and tighten these policies before sharing the link.
alter table public.products enable row level security;
alter table public.inventory_history enable row level security;
create policy "products: full access" on public.products for all to anon, authenticated using (true) with check (true);
create policy "history: read" on public.inventory_history for select to anon, authenticated using (true);
create policy "history: insert" on public.inventory_history for insert to anon, authenticated with check (true);
