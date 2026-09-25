-- ============================================================
-- Migration: email on profiles (idempotent — safe to re-run)
--
-- Stores each account's email next to its profile row so the
-- profiles table shows who every row belongs to.
-- ============================================================

alter table public.profiles
  add column if not exists email text;

-- Backfill existing rows from their auth accounts.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- New signups store the email automatically (keeps the role
-- whitelist from the auth hardening migration intact).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'buyer');
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when requested_role in ('buyer', 'seller') then requested_role::public.user_role
      else 'buyer'::public.user_role
    end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
