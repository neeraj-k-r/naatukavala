-- ============================================================
-- Migration: auth hardening (idempotent — safe to re-run)
--
-- 1. handle_new_user() only accepts 'buyer'/'seller' from the
--    client-controlled signup metadata. Attackers calling Supabase
--    directly can no longer mint 'admin'/'superadmin' profiles.
-- 2. prevent_profile_role_escalation() stops users from promoting
--    themselves via the anon key. Only the service_role key (backend
--    admin operations, which bypass RLS) may change roles.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'buyer');
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when requested_role in ('buyer', 'seller') then requested_role::public.user_role
      else 'buyer'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (auth.jwt() ->> 'role') = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_role_escalation();
