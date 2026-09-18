-- ============================================================
-- Migration: seller promotions / sponsored spots (idempotent)
--
-- Sellers request promotion for their whole shop (product_id null)
-- or a single product. Admins approve (with a time-boxed window),
-- reject, or expire promotions. Approved + in-window promotions get
-- the marketplace spotlight and Sponsored badges.
-- ============================================================

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'expired')),
  note text,
  decision_note text,
  starts_at timestamptz,
  ends_at timestamptz,
  decided_by uuid references auth.users (id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists promotions_shop_idx on public.promotions (shop_id);
create index if not exists promotions_product_idx on public.promotions (product_id);
create index if not exists promotions_status_idx on public.promotions (status);

alter table public.promotions enable row level security;

-- Owners read their own promotion requests.
drop policy if exists promotions_select_owner on public.promotions;
create policy promotions_select_owner on public.promotions
  for select using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  );

-- Owners can file requests for their own shops. Status changes are
-- intentionally NOT granted here, so sellers cannot approve themselves;
-- admin decisions go through the backend service_role key (bypasses RLS).
drop policy if exists promotions_insert_owner on public.promotions;
create policy promotions_insert_owner on public.promotions
  for insert with check (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  );

-- Everyone may see currently-active (approved + in-window) promotions.
drop policy if exists promotions_select_public on public.promotions;
create policy promotions_select_public on public.promotions
  for select using (
    status = 'approved'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );
