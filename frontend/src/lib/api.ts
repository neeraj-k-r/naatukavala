import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { Database } from "@/lib/database";
import type {
  Order,
  OrderStatusEvent,
  Product,
  ProductWithShop,
  RatingSummary,
  Shop,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function getAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Calls the backend API with the signed-in user's Supabase JWT attached. */
export async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return (body ?? {}) as T;
}

// ---------------------------------------------------------------- Public

/** Approved shops only (visible to the public). */
export async function getActiveShops(): Promise<Shop[]> {
  const { shops } = await fetchApi<{ shops: Shop[] }>("/shops/marketplace");
  return shops ?? [];
}

export type MarketplaceFilters = {
  search?: string;
  category?: string;
  shopSlug?: string;
  limit?: number;
};

/** Products available to buyers, with shop name/slug/delivery charge joined in. */
export async function getMarketplaceProducts({
  search,
  category,
  shopSlug,
  limit,
}: MarketplaceFilters = {}): Promise<ProductWithShop[]> {
  const qs = new URLSearchParams();
  if (search?.trim()) qs.set("search", search.trim());
  if (category) qs.set("category", category);
  if (shopSlug) qs.set("shopSlug", shopSlug);
  if (limit) qs.set("limit", String(limit));

  const { products } = await fetchApi<{ products: ProductWithShop[] }>(
    `/products/marketplace${qs.size > 0 ? `?${qs}` : ""}`,
  );
  return products ?? [];
}

/** Distinct product categories across all approved shops. */
export async function getCategories(): Promise<string[]> {
  const { categories } = await fetchApi<{ categories: string[] }>(
    "/products/categories",
  );
  return categories ?? [];
}

export async function getShopBySlug(
  slug: string,
): Promise<{ shop: Shop; products: Product[] } | null> {
  try {
    return await fetchApi<{ shop: Shop; products: Product[] }>(
      `/shops/${encodeURIComponent(slug)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getProductById(
  id: string,
): Promise<ProductWithShop | null> {
  try {
    const { product } = await fetchApi<{ product: ProductWithShop }>(
      `/products/${encodeURIComponent(id)}`,
    );
    return product ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// ---------------------------------------------------------------- User

/** Any shop owned by a user, regardless of status (used by sellers). */
export async function getShopByOwner(
  _ownerId: string,
): Promise<Shop | null> {
  void _ownerId;
  const { shop } = await fetchApi<{ shop: Shop | null }>(
    `/shops/owner/${encodeURIComponent(_ownerId)}`,
  );
  return shop ?? null;
}

/** Products owned by the signed-in shop owner. */
export async function getOwnerProducts(_ownerId: string): Promise<Product[]> {
  void _ownerId;
  const { products } = await fetchApi<{ products: Product[] }>(
    "/products/owner",
  );
  return products ?? [];
}

/** Orders the signed-in buyer placed. */
export async function getBuyerOrders(_buyerId: string): Promise<Order[]> {
  void _buyerId;
  const { orders } = await fetchApi<{ orders: Order[] }>("/orders/buyer");
  return orders ?? [];
}

/** Orders placed against the signed-in seller's shop. */
export async function getSellerOrders(_ownerId: string): Promise<Order[]> {
  void _ownerId;
  const { orders } = await fetchApi<{ orders: Order[] }>("/orders/seller");
  return orders ?? [];
}

/** Flat list of order-item rows for the given orders. */
export async function getOrderItems(orderIds: string[]) {
  const items: Database["public"]["Tables"]["order_items"]["Row"][] = [];
  for (const orderId of orderIds) {
    const { items: rows } = await fetchApi<{
      items: Database["public"]["Tables"]["order_items"]["Row"][];
    }>(`/orders/${encodeURIComponent(orderId)}/items`);
    items.push(...(rows ?? []));
  }
  return items;
}

/** Tracking details (current status + timeline) for one order. */
export async function getOrderTracking(orderId: string) {
  const { order, history } = await fetchApi<{
    order: {
      id: string;
      status: Order["status"];
      tracking_number: string | null;
      created_at: string;
      shop: Pick<Shop, "name" | "slug"> & { slug: string } | null;
    };
    history: OrderStatusEvent[];
  }>(`/orders/${encodeURIComponent(orderId)}/tracking`);
  return { order, history: history ?? [] };
}

// ---------------------------------------------------------------- Reviews

/** Aggregated public reviews (rating summary + recent list) for a product. */
export async function getProductReviews(productId: string): Promise<RatingSummary> {
  return fetchApi(`/products/reviews/${encodeURIComponent(productId)}`);
}

/** Aggregated public reviews (rating summary + recent list) for a shop. */
export async function getShopReviews(slug: string): Promise<RatingSummary> {
  return fetchApi(`/shops/reviews/${encodeURIComponent(slug)}`);
}

// ---------------------------------------------------------------- Admin

export async function getAllShops() {
  const { shops } = await fetchApi<{ shops: (Shop & { owner_name: string | null })[] }>(
    "/admin/shops",
  );
  return shops ?? [];
}

export async function getAllUsers() {
  const { users } = await fetchApi<{
    users: {
      id: string;
      email: string;
      full_name: string;
      role: string;
      created_at: string;
    }[];
  }>("/admin/users");
  return users ?? [];
}