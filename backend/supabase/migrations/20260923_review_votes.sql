-- ============================================================
-- Migration: helpful votes on reviews (idempotent — safe to re-run)
--
-- Signed-in users mark delivered-order reviews as helpful, one
-- vote per (review order, voter).
-- ============================================================

create table if not exists public.review_votes (
  order_id uuid not null references public.orders (id) on delete cascade,
  voter_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (order_id, voter_id)
);

create index if not exists review_votes_order_idx on public.review_votes (order_id);
create index if not exists review_votes_voter_idx on public.review_votes (voter_id);

alter table public.review_votes enable row level security;

-- Users manage only their own votes.
drop policy if exists review_votes_select_own on public.review_votes;
create policy review_votes_select_own on public.review_votes
  for select using (voter_id = auth.uid());

drop policy if exists review_votes_insert_own on public.review_votes;
create policy review_votes_insert_own on public.review_votes
  for insert with check (voter_id = auth.uid());

drop policy if exists review_votes_delete_own on public.review_votes;
create policy review_votes_delete_own on public.review_votes
  for delete using (voter_id = auth.uid());
