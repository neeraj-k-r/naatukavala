-- ============================================================
-- Migration: product variants (idempotent — safe to re-run)
--
-- Sellers add options like Size:Large or Color:Red, each with its own
-- price and stock. Buyers pick a variant; orders snapshot the choice.
-- order_items.variant_id has NO foreign key on purpose: past orders
-- keep pointing at the id even after sellers edit variant rows.
-- ============================================================

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  option_name text not null,
  option_value text not null,
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, option_name, option_value)
);

create index if not exists product_variants_product_idx
  on public.product_variants (product_id);

alter table public.order_items
  add column if not exists variant_id uuid;

alter table public.product_variants enable row level security;

-- Mirrors the products policies: public sees variants of live products,
-- owners manage their own. Backend service key bypasses these anyway.
drop policy if exists product_variants_select_public on public.product_variants;
create policy product_variants_select_public on public.product_variants
  for select using (
    is_active = true
    and exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_id
        and p.is_active = true
        and s.status = 'approved'::public.shop_status
    )
  );

drop policy if exists product_variants_select_owner on public.product_variants;
create policy product_variants_select_owner on public.product_variants
  for select using (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists product_variants_insert_owner on public.product_variants;
create policy product_variants_insert_owner on public.product_variants
  for insert with check (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists product_variants_update_owner on public.product_variants;
create policy product_variants_update_owner on public.product_variants
  for update using (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists product_variants_delete_owner on public.product_variants;
create policy product_variants_delete_owner on public.product_variants
  for delete using (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );
