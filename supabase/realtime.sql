-- Run once in the SQL Editor to enable live updates across devices (Supabase Realtime).
alter publication supabase_realtime add table public.products, public.inventory_history;
