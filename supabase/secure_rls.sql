-- Run ONLY AFTER: (1) you created your user in Authentication -> Users, (2) the login version of the app is deployed
-- and you've confirmed you can sign in. After this, only signed-in users can read or change any data.
drop policy if exists "products: full access" on public.products;
create policy "products: signed-in only" on public.products for all to authenticated using (true) with check (true);

drop policy if exists "history: read" on public.inventory_history;
drop policy if exists "history: insert" on public.inventory_history;
create policy "history: read (signed-in)" on public.inventory_history for select to authenticated using (true);
create policy "history: insert (signed-in)" on public.inventory_history for insert to authenticated with check (true);

drop policy if exists "sales: read" on public.sales;
drop policy if exists "sales: insert" on public.sales;
create policy "sales: read (signed-in)" on public.sales for select to authenticated using (true);
create policy "sales: insert (signed-in)" on public.sales for insert to authenticated with check (true);

revoke execute on function public.adjust_stock(uuid, integer), public.delete_product(uuid), public.record_sale(uuid, integer, text), public.sales_summary() from public, anon;
grant execute on function public.adjust_stock(uuid, integer), public.delete_product(uuid), public.record_sale(uuid, integer, text), public.sales_summary() to authenticated;
