import "server-only";

import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";

import type { Order, Product, ProductWithShop, Shop } from "@/lib/types";

export { connection };

/** Approved shops only (visible to the public). */
export async function getActiveShops(): Promise<Shop[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Shop[];
}

/** Distinct product categories across all approved shops. RLS limits to approved shops. */
export async function getCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .eq("is_active", true)
    .not("category", "is", null);

  if (error) throw error;
  const categories = new Set(
    (data ?? [])
      .map((row) => row.category as string)
      .filter(Boolean)
      .sort(),
  );
  return [...categories];
}

export type MarketplaceFilters = {
  search?: string;
  category?: string;
  shopSlug?: string;
  limit?: number;
};

/**
 * Products available to buyers: active products belonging to approved shops,
 * with the shop's name/slug joined in. RLS enforces the approved-shop filter.
 */
export async function getMarketplaceProducts({
  search,
  category,
  shopSlug,
  limit,
}: MarketplaceFilters = {}): Promise<ProductWithShop[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, shop:shops(name, slug, delivery_charge)")
    .eq("is_active", true);

  if (category) query = query.eq("category", category);
  if (shopSlug) query = query.eq("shop.slug", shopSlug);

  if (search && search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }
  if (limit) query = query.limit(limit);

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ProductWithShop[];
}

export async function getShopBySlug(
  slug: string,
): Promise<{ shop: Shop; products: Product[] } | null> {
  const supabase = await createClient();
  const { data: shop, error } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!shop) return null;

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return { shop: shop as Shop, products: (products ?? []) as Product[] };
}

/** Any shop owned by a user, regardless of status (used by sellers). */
export async function getShopByOwner(ownerId: string): Promise<Shop | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as Shop) ?? null;
}

/** Products owned by a shop owner. */
export async function getOwnerProducts(ownerId: string): Promise<Product[]> {
  const shop = await getShopByOwner(ownerId);
  if (!shop) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProductById(
  id: string,
): Promise<ProductWithShop | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, shop:shops(name, slug, delivery_charge)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as ProductWithShop) ?? null;
}

/** Orders a buyer placed. */
export async function getBuyerOrders(buyerId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, shop:shops(name, slug)")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}

export async function getOrderItems(orderIds: string[]) {
  if (orderIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);

  if (error) throw error;
  return data ?? [];
}

/**
 * Orders placed against the shop owned by `ownerId` (seller view).
 */
export async function getSellerOrders(ownerId: string): Promise<Order[]> {
  const shop = await getShopByOwner(ownerId);
  if (!shop) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, shop:shops(name, slug)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}