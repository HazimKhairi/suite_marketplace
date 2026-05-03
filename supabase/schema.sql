-- Suite Marketplace — Volleyball UiTM Kuala Terengganu
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- =========================================
-- TABLES
-- =========================================

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null default 'jersey'
    check (category in ('jersey','jacket')),
  sleeve_type text
    check (sleeve_type in ('short','long')),
  color text not null,
  price numeric(10,2) not null,
  stock integer not null default 0,
  image_url text not null,
  description text,
  sizes text[] default array['S','M','L','XL','XXL'],
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_method text not null check (delivery_method in ('pickup','delivery')),
  delivery_address text,
  subtotal numeric(10,2) not null,
  shipping_fee numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','verifying','paid','shipped','completed','rejected','cancelled')),
  receipt_url text,
  ocr_result jsonb,
  ocr_match boolean,
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  category text not null default 'jersey' check (category in ('jersey','jacket')),
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  -- Per-line personalization (jersey only). Jackets keep these null.
  player_name text,
  player_number text,
  player_type text check (player_type in ('player','non_player')),
  sleeve_type text check (sleeve_type in ('short','long'))
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

-- order_number generator (VB-YYYYMMDD-XXXX)
create or replace function public.gen_order_number() returns trigger as $$
declare
  d text := to_char(now(), 'YYYYMMDD');
  c integer;
begin
  select count(*) + 1 into c from public.orders
    where order_number like 'VB-' || d || '-%';
  new.order_number := 'VB-' || d || '-' || lpad(c::text, 4, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_number on public.orders;
create trigger trg_orders_number before insert on public.orders
  for each row when (new.order_number is null or new.order_number = '')
  execute function public.gen_order_number();

-- =========================================
-- STORAGE — receipts bucket (private)
-- =========================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
  for select using (active = true);

-- orders & order_items: only admin (service role bypasses RLS automatically)

-- Storage policies
drop policy if exists "receipts_insert_anon" on storage.objects;
create policy "receipts_insert_anon" on storage.objects
  for insert with check (bucket_id = 'receipts');

drop policy if exists "receipts_read_admin" on storage.objects;
create policy "receipts_read_admin" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and (auth.jwt() ->> 'role' = 'service_role' or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
  );
