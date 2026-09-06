import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";

import type { Order, Product, Shop, UserRole } from "@/lib/types";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export async function getAllShops(): Promise<(Shop & { owner_name: string | null })[]> {
  const admin = getAdminClient();

  const { data, error } = await admin
    .from("shops")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const shopRows = (data ?? []) as Shop[];
  const ownerIds = [...new Set(shopRows.map((shop) => shop.owner_id))];

  const ownerNames = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);
    if (profilesError) throw profilesError;
    for (const profile of profiles ?? []) {
      ownerNames.set(profile.id, profile.full_name);
    }
  }

  return shopRows.map((shop) => ({
    ...shop,
    owner_name: ownerNames.get(shop.owner_id) ?? null,
  }));
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const admin = getAdminClient();

  const { data: { users }, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;

  const ids = users.map((user) => user.id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .in("id", ids);

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return users.map((user) => {
    const profile = profileById.get(user.id);
    return {
      id: user.id,
      email: user.email ?? "",
      full_name: profile?.full_name ?? "",
      role: (profile?.role as UserRole | undefined) ?? "buyer",
      created_at: user.created_at ?? new Date().toISOString(),
    };
  });
}

export async function getAdminStats() {
  const admin = getAdminClient();

  const [shops, users, products, orders] = await Promise.all([
    admin.from("shops").select("id, status"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("products").select("id"),
    admin.from("orders").select("id"),
  ]);

  const shopRows = shops.data ?? [];
  const pending = shopRows.filter((shop) => shop.status === "pending").length;

  return {
    totalShops: shopRows.length,
    pendingShops: pending,
    approvedShops: shopRows.filter((shop) => shop.status === "approved").length,
    totalUsers: users.data?.users.length ?? 0,
    totalProducts: products.data?.length ?? 0,
    totalOrders: orders.data?.length ?? 0,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getAdminOrders(): Promise<Order[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*, shop:shops(name, slug)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}