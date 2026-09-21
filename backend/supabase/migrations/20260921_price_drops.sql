-- ============================================================
-- Migration: price-drop alerts on wishlist (idempotent)
--
-- price_at_save records what the product cost when the buyer saved
-- it. notified_price records the price the buyer was last alerted
-- about, so each further drop alerts exactly once.
-- ============================================================

alter table public.wishlists
  add column if not exists price_at_save numeric(12, 2);

alter table public.wishlists
  add column if not exists notified_price numeric(12, 2);

-- Baseline existing rows at today's price so only future drops alert.
update public.wishlists w
set price_at_save = p.price
from public.products p
where w.product_id = p.id
  and w.price_at_save is null;
