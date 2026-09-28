-- ============================================================
-- Migration: buyer phone on orders (idempotent — safe to re-run)
--
-- Captured at checkout so sellers can contact buyers about
-- delivery. Snapshot per order, like the shipping address.
-- ============================================================

alter table public.orders
  add column if not exists buyer_phone text;
