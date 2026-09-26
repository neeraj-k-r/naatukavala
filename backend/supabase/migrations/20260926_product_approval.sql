-- ============================================================
-- Migration: product approval for unverified sellers (idempotent)
--
-- Verified sellers go live instantly. Everyone else's new or edited
-- products wait in 'pending' until an admin approves them. Existing
-- products are grandfathered as approved.
-- ============================================================

alter table public.products
  add column if not exists approval_status text not null default 'approved'
  check (approval_status in ('approved', 'pending', 'rejected'));

create index if not exists products_approval_idx
  on public.products (approval_status);

-- Public reads now also require an approved product.
drop policy if exists products_select_public on public.products;
create policy products_select_public on public.products
  for select using (
    is_active = true
    and approval_status = 'approved'
    and exists (
      select 1 from public.shops s
      where s.id = shop_id and s.status = 'approved'::public.shop_status
    )
  );
