-- ============================================================
-- Migration: review photos (idempotent — safe to re-run)
--
-- Buyers attach photos to the feedback on delivered orders.
-- ============================================================

alter table public.orders
  add column if not exists feedback_images text[] not null default '{}';
