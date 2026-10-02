-- ============================================================
-- Migration: product deletion audit (idempotent — safe to re-run)
--
-- Superadmins can delete any product with a mandatory reason.
-- Hard-deleted rows vanish, so keep who/why in product_deletions.
-- ============================================================

create table if not exists public.product_deletions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  product_name text,
  shop_id uuid references public.shops (id) on delete set null,
  deleted_by uuid references auth.users (id) on delete set null,
  reason text not null,
  soft boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_deletions_shop_idx
  on public.product_deletions (shop_id);
create index if not exists product_deletions_created_idx
  on public.product_deletions (created_at desc);

alter table public.product_deletions enable row level security;

-- Backend service key only; no public policies by design.
