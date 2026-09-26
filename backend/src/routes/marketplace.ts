import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { cached } from "../lib/cache.js";
import { hasApprovalColumn } from "../lib/productApproval.js";
import { verifyToken } from "../middleware/auth.js";

const router: Router = express.Router();

/**
 * One call for the whole marketplace page: products, shops, spotlight and
 * categories in parallel under a single cache entry, with one auth check.
 * Replaces 4 separate roundtrips from the homepage. When a valid bearer
 * token is attached, the user's wishlist ids ride along too.
 */
router.get("/bootstrap", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";

  try {
    const supabase = getSupabaseAdmin();
    const header = req.headers.authorization;
    const user =
      header?.startsWith("Bearer ") ? await verifyToken(header.slice(7)) : null;

    const key = `bootstrap|${search.trim()}|${category}`;
    const data = await cached(key, async () => {
      const [products, shops, spotlight, categories] = await Promise.all([
        (async () => {
          let query = supabase
            .from("products")
            .select("*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status)")
            .eq("is_active", true)
            .eq("shop.status", "approved");
          if (await hasApprovalColumn()) query = query.eq("approval_status", "approved");
          if (category) query = query.eq("category", category);
          if (search && search.trim()) query = query.ilike("name", `%${search.trim()}%`);
          query = query.order("created_at", { ascending: false });
          const { data, error } = await query;
          if (error) throw error;
          return data ?? [];
        })(),
        (async () => {
          const { data, error } = await supabase
            .from("shops")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false });
          if (error) throw error;
          return data ?? [];
        })(),
        (async () => {
          const now = new Date().toISOString();
          const { data: promos, error } = await supabase
            .from("promotions")
            .select("shop_id, product_id, created_at")
            .eq("status", "approved")
            .or("starts_at.is.null,starts_at.lte." + now)
            .or("ends_at.is.null,ends_at.gt." + now)
            .order("created_at", { ascending: false });
          if (error) {
            // Promotions table not migrated yet — spotlight stays empty.
            return { products: [], shops: [] };
          }
          const promoProductIds = [...new Set(
            (promos ?? []).map((p) => p.product_id).filter((id): id is string => Boolean(id)),
          )];
          const promoShopIds = [...new Set(
            (promos ?? []).filter((p) => !p.product_id).map((p) => p.shop_id),
          )];
          let products: unknown[] = [];
          let shops: unknown[] = [];
          if (promoProductIds.length > 0) {
            let productQuery = supabase
              .from("products")
              .select("*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status)")
              .in("id", promoProductIds)
              .eq("is_active", true)
              .eq("shop.status", "approved");
            if (await hasApprovalColumn()) {
              productQuery = productQuery.eq("approval_status", "approved");
            }
            const { data } = await productQuery;
            const rank = new Map(promoProductIds.map((id, i) => [id, i]));
            products = ((data ?? []) as { id: string }[])
              .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
              .slice(0, 12);
          }
          if (promoShopIds.length > 0) {
            const { data } = await supabase
              .from("shops")
              .select("*")
              .in("id", promoShopIds)
              .eq("status", "approved");
            const rank = new Map(promoShopIds.map((id, i) => [id, i]));
            shops = ((data ?? []) as { id: string }[])
              .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
              .slice(0, 8);
          }
          return { products, shops };
        })(),
        (async () => {
          let categoryQuery = supabase
            .from("products")
            .select("category, shop:shops!inner(status)")
            .eq("is_active", true)
            .eq("shop.status", "approved")
            .not("category", "is", null);
          if (await hasApprovalColumn()) {
            categoryQuery = categoryQuery.eq("approval_status", "approved");
          }
          const { data, error } = await categoryQuery;
          if (error) throw error;
          return [...new Set(
            ((data ?? []) as { category: string | null }[])
              .map((row) => row.category)
              .filter(Boolean)
              .sort(),
          )] as string[];
        })(),
      ]);
      return { products, shops, spotlight, categories };
    });

    let wishlistIds: string[] = [];
    if (user) {
      const { data: rows } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("buyer_id", user.id);
      wishlistIds = ((rows ?? []) as { product_id: string }[]).map(
        (row) => row.product_id,
      );
    }

    return res.json({ ...data, wishlistIds });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load marketplace." });
  }
});

export default router;
