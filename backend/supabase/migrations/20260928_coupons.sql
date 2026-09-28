-- ============================================================
-- Migration: coupon codes (idempotent — safe to re-run)
--
-- Admins create flat (Rs off) or percent-off codes. Buyers apply one
-- code per checkout; the discount splits across that checkout's shop
-- orders. coupon_redemptions enforces total and per-user limits.
-- ============================================================

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind text not null check (kind in ('flat', 'percent')),
  value numeric(12, 2) not null check (value > 0),
  min_order_value numeric(12, 2) not null default 0 check (min_order_value >= 0),
  max_discount numeric(12, 2) check (max_discount is null or max_discount > 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists coupon_redemptions_coupon_idx
  on public.coupon_redemptions (coupon_id);
create index if not exists coupon_redemptions_buyer_idx
  on public.coupon_redemptions (buyer_id);

alter table public.orders
  add column if not exists coupon_code text;
alter table public.orders
  add column if not exists discount numeric(12, 2) not null default 0;

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

-- Read through the backend service key only (admin UI + checkout).
-- Buyers see their own redemptions for order history.
drop policy if exists coupon_redemptions_select_own on public.coupon_redemptions;
create policy coupon_redemptions_select_own on public.coupon_redemptions
  for select using (buyer_id = auth.uid());
