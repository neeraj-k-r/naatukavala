-- ============================================================
-- Naatukavala database schema
-- Run this in the Supabase SQL editor (as the postgres role).
-- ============================================================

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type public.user_role as enum ('superadmin', 'admin', 'seller', 'buyer');
create type public.shop_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- ------------------------------------------------------------
-- Profiles (extends auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  role public.user_role not null default 'buyer',
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Shops (one per seller, owns a subdomain)
-- ------------------------------------------------------------
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  tagline text,
  description text,
  logo_url text,
  banner_url text,
  status public.shop_status not null default 'pending',
  delivery_charge numeric(12, 2) not null default 0 check (delivery_charge >= 0),
  return_policy text,
  verification_doc_url text,
  verification_status text not null default 'none' check (verification_status in ('none', 'pending', 'verified', 'rejected')),
  verified_at timestamptz,
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists shops_owner_idx on public.shops (owner_id);
create index if not exists shops_status_idx on public.shops (status);
create index if not exists shops_slug_idx on public.shops (slug);

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'INR',
  category text,
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_shop_idx on public.products (shop_id);
create index if not exists products_category_idx on public.products (category);

-- ------------------------------------------------------------
-- Orders + order items
-- ------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete restrict,
  status public.order_status not null default 'pending',
  total numeric(12, 2) not null default 0,
  currency text not null default 'INR',
  shipping_address text,
  buyer_note text,
  tracking_number text,
  rating smallint check (rating between 1 and 5),
  feedback text,
  feedback_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists orders_buyer_idx on public.orders (buyer_id);
create index if not exists orders_shop_idx on public.orders (shop_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,
  image_url text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null,
  currency text not null default 'INR'
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ------------------------------------------------------------
-- Order status history (package tracking timeline)
-- ------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on public.order_status_history (order_id);

-- ------------------------------------------------------------
-- Order returns (buyers request returns on shops with a policy)
-- ------------------------------------------------------------
create table if not exists public.order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  description text,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decision_note text
);

create index if not exists order_returns_order_idx on public.order_returns (order_id);
create index if not exists order_returns_buyer_idx on public.order_returns (buyer_id);

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Create a profile automatically whenever a user signs up.
-- Only 'buyer'/'seller' are accepted from client-supplied metadata —
-- never grant admin/superadmin from a value the client controls.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Block self-service role escalation: only the service_role key (backend
-- admin operations, which bypass RLS) may change a profile's role.
-- Regular users keep their existing role even if they issue an update.
-- ------------------------------------------------------------
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_returns enable row level security;

-- profiles: users manage their own; a signed-in user may always read their own row.
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- shops
-- Public reads approved shops; owners read any of their own shops.
create policy shops_select_public on public.shops
  for select using (status = 'approved'::public.shop_status);
create policy shops_select_owner on public.shops
  for select using (owner_id = auth.uid());
create policy shops_insert_owner on public.shops
  for insert with check (owner_id = auth.uid());
create policy shops_update_owner on public.shops
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy shops_delete_owner on public.shops
  for delete using (owner_id = auth.uid());

-- products
-- Buyers see active products from approved shops; owners see everything of theirs.
create policy products_select_public on public.products
  for select using (
    is_active = true
    and exists (
      select 1 from public.shops s
      where s.id = shop_id and s.status = 'approved'::public.shop_status
    )
  );
create policy products_select_owner on public.products
  for select using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  );
create policy products_insert_owner on public.products
  for insert with check (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  );
create policy products_update_owner on public.products
  for update using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  );
create policy products_delete_owner on public.products
  for delete using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  );

-- orders
-- Buyers read/place their own orders; sellers read/update orders for their shops.
create policy orders_select_buyer on public.orders
  for select using (buyer_id = auth.uid());
create policy orders_select_seller on public.orders
  for select using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
)
  );
create policy order_returns_insert_buyer on public.order_returns
  for insert with check (buyer_id = auth.uid());

-- ------------------------------------------------------------
-- Migration: seller verification (Aadhaar, idempotent — safe to re-run).
-- ------------------------------------------------------------
alter table public.shops
  add column if not exists verification_doc_url text;
alter table public.shops
  add column if not exists verification_status text not null default 'none';
alter table public.shops
  add column if not exists verified_at timestamptz;
create policy orders_update_seller on public.orders
  for update using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  );

-- order_items: accessible through the parent order.
create policy order_items_select_buyer on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );
create policy order_items_select_seller on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      join public.shops s on s.id = o.shop_id
      where o.id = order_id and s.owner_id = auth.uid()
    )
  );
create policy order_items_insert_buyer on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

-- order_status_history: readable through the parent order.
create policy order_status_history_select_buyer on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );
create policy order_status_history_select_seller on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      join public.shops s on s.id = o.shop_id
      where o.id = order_id and s.owner_id = auth.uid()
    )
  );

-- order_returns: buyers manage their own; sellers read returns for their shop's orders.
create policy order_returns_select_buyer on public.order_returns
  for select using (buyer_id = auth.uid());
create policy order_returns_select_seller on public.order_returns
  for select using (
    exists (
      select 1 from public.orders o
      join public.shops s on s.id = o.shop_id
      where o.id = order_id and s.owner_id = auth.uid()
    )
  );
create policy order_returns_insert_buyer on public.order_returns
  for insert with check (buyer_id = auth.uid());

-- ------------------------------------------------------------
-- Migration: delivery charge (idempotent — safe to re-run).
-- ------------------------------------------------------------
alter table public.shops
  add column if not exists delivery_charge numeric(12, 2) not null default 0;

-- ------------------------------------------------------------
-- Migration: buyer feedback on orders (idempotent — safe to re-run).
-- ------------------------------------------------------------
alter table public.orders
  add column if not exists rating smallint check (rating between 1 and 5);
alter table public.orders
  add column if not exists feedback text;
alter table public.orders
  add column if not exists feedback_at timestamptz;

-- ------------------------------------------------------------
-- Migration: package tracking (idempotent — safe to re-run).
-- ------------------------------------------------------------
alter table public.orders
  add column if not exists tracking_number text;

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on public.order_status_history (order_id);

alter table public.order_status_history enable row level security;

create policy order_status_history_select_buyer on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );
create policy order_status_history_select_seller on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      join public.shops s on s.id = o.shop_id
      where o.id = order_id and s.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Migration: order returns (idempotent — safe to re-run).
-- ------------------------------------------------------------
alter table public.shops
  add column if not exists return_policy text;

create table if not exists public.order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  description text,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decision_note text
);

create index if not exists order_returns_order_idx on public.order_returns (order_id);
create index if not exists order_returns_buyer_idx on public.order_returns (buyer_id);

alter table public.order_returns enable row level security;

create policy order_returns_select_buyer on public.order_returns
  for select using (buyer_id = auth.uid());
create policy order_returns_select_seller on public.order_returns
  for select using (
    exists (
      select 1 from public.orders o
      join public.shops s on s.id = o.shop_id
      where o.id = order_id and s.owner_id = auth.uid()
    )
  );
create policy order_returns_insert_buyer on public.order_returns
  for insert with check (buyer_id = auth.uid());
-- ------------------------------------------------------------
-- Promotions / sponsored spots (sellers request, admins approve).
-- Sellers promote their whole shop (product_id null) or one product.
-- ------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'expired')),
  note text,
  decision_note text,
  starts_at timestamptz,
  ends_at timestamptz,
  decided_by uuid references auth.users (id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists promotions_shop_idx on public.promotions (shop_id);
create index if not exists promotions_product_idx on public.promotions (product_id);
create index if not exists promotions_status_idx on public.promotions (status);

alter table public.promotions enable row level security;

create policy promotions_select_owner on public.promotions
  for select using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  );
create policy promotions_insert_owner on public.promotions
  for insert with check (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.owner_id = auth.uid()
    )
  );
create policy promotions_select_public on public.promotions
  for select using (
    status = 'approved'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

-- ------------------------------------------------------------
-- Wishlist (signed-in users save products for later).
-- ------------------------------------------------------------
create table if not exists public.wishlists (
  buyer_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (buyer_id, product_id)
);

create index if not exists wishlists_buyer_idx on public.wishlists (buyer_id);
create index if not exists wishlists_product_idx on public.wishlists (product_id);

alter table public.wishlists enable row level security;

create policy wishlists_select_own on public.wishlists
  for select using (buyer_id = auth.uid());
create policy wishlists_insert_own on public.wishlists
  for insert with check (buyer_id = auth.uid());
create policy wishlists_delete_own on public.wishlists
  for delete using (buyer_id = auth.uid());

-- Price-drop alerts: baseline price + last notified price per saved item.
alter table public.wishlists
  add column if not exists price_at_save numeric(12, 2);
alter table public.wishlists
  add column if not exists notified_price numeric(12, 2);

-- Review photos: buyers attach photos to delivered-order feedback.
alter table public.orders
  add column if not exists feedback_images text[] not null default '{}';

-- Helpful votes: one vote per (review order, voter).
create table if not exists public.review_votes (
  order_id uuid not null references public.orders (id) on delete cascade,
  voter_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (order_id, voter_id)
);

create index if not exists review_votes_order_idx on public.review_votes (order_id);
create index if not exists review_votes_voter_idx on public.review_votes (voter_id);

alter table public.review_votes enable row level security;

create policy review_votes_select_own on public.review_votes
  for select using (voter_id = auth.uid());
create policy review_votes_insert_own on public.review_votes
  for insert with check (voter_id = auth.uid());
create policy review_votes_delete_own on public.review_votes
  for delete using (voter_id = auth.uid());

