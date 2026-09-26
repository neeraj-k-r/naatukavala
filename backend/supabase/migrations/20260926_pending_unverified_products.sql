-- ============================================================
-- Migration: queue existing products of unverified sellers (idempotent)
--
-- The approval gate covers new and edited products, but rows created
-- before the gate existed were grandfathered as approved. Push every
-- product of an ID-unverified shop back to 'pending' so the admin
-- review queue is the only path to the marketplace for them.
-- ============================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'approval_status'
  ) then
    update public.products p
    set approval_status = 'pending'
    from public.shops s
    where p.shop_id = s.id
      and coalesce(s.verification_status, 'none') <> 'verified'
      and p.approval_status = 'approved';
  end if;
end
$$;
