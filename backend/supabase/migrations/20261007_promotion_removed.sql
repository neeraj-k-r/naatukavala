-- Admins can take a live sponsorship down before it ends, and record why.
-- The reason is returned to the seller on their Promote page.
do $$
declare
  existing_constraint text;
begin
  for existing_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.promotions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.promotions drop constraint %I', existing_constraint);
  end loop;
end $$;

alter table public.promotions
  add constraint promotions_status_check
  check (status in ('requested', 'approved', 'rejected', 'expired', 'removed'));
