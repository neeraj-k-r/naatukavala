-- ============================================================
-- Migration: buyer wishlist (idempotent — safe to re-run)
--
-- Signed-in users save products for later. One row per
-- (buyer, product); deleting a product cleans up its rows.
-- ============================================================

create table if not exists public.wishlists (
  buyer_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (buyer_id, product_id)
);

create index if not exists wishlists_buyer_idx on public.wishlists (buyer_id);
create index if not exists wishlists_product_idx on public.wishlists (product_id);

alter table public.wishlists enable row level security;

-- Users manage only their own wishlist rows.
drop policy if exists wishlists_select_own on public.wishlists;
create policy wishlists_select_own on public.wishlists
  for select using (buyer_id = auth.uid());

drop policy if exists wishlists_insert_own on public.wishlists;
create policy wishlists_insert_own on public.wishlists
  for insert with check (buyer_id = auth.uid());

drop policy if exists wishlists_delete_own on public.wishlists;
create policy wishlists_delete_own on public.wishlists
  for delete using (buyer_id = auth.uid());
