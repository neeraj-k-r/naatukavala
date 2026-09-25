-- ============================================================
-- Migration: admin notifications (idempotent — safe to re-run)
--
-- Alerts for shops that don't accept orders: pending orders older
-- than 1 day are auto-cancelled, and one unread notification per
-- shop tracks how many orders it isn't accepting. Read and written
-- through the backend service key (admin UI), so no public policies.
-- ============================================================

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'unaccepted_orders'
    check (kind in ('unaccepted_orders')),
  shop_id uuid references public.shops (id) on delete cascade,
  order_count integer not null default 0,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_notifications_shop_idx
  on public.admin_notifications (shop_id);
create index if not exists admin_notifications_unread_idx
  on public.admin_notifications (is_read) where is_read = false;

alter table public.admin_notifications enable row level security;

drop trigger if exists admin_notifications_set_updated_at
  on public.admin_notifications;
create trigger admin_notifications_set_updated_at
  before update on public.admin_notifications
  for each row execute function public.set_updated_at();
