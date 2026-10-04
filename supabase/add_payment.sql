-- Run ONCE in the Supabase SQL Editor BEFORE deploying the payment update. Existing products become "Not Paid".
alter table public.products
  add column if not exists payment_status text not null default 'not_paid' check (payment_status in ('paid','not_paid')),
  add column if not exists payment_mode text check (payment_mode in ('cash','gcash','maya','bank','card','other')),
  add column if not exists payment_reference text check (payment_reference is null or length(payment_reference) <= 60);
