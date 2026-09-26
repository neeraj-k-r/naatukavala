import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { cached, clearCache } from "../lib/cache.js";
import { hasApprovalColumn } from "../lib/productApproval.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

const MAX_NOTE_LENGTH = 300;
const DEFAULT_DURATION_DAYS = 30;
const MAX_DURATION_DAYS = 90;

/** Public spotlight: approved promotions inside their active window. */
router.get("/spotlight", async (_req, res) => {
  try {
    const data = await cached("promotions:spotlight", async () => {
      const supabase = getSupabaseAdmin();
      const now = new Date().toISOString();

      const { data: promos, error } = await supabase
        .from("promotions")
        .select("shop_id, product_id, created_at")
        .eq("status", "approved")
        .or("starts_at.is.null,starts_at.lte." + now)
        .or("ends_at.is.null,ends_at.gt." + now)
        .order("created_at", { ascending: false });

      if (error) throw error;

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
        const { data, error: productError } = await productQuery;
        if (productError) throw productError;
        const rank = new Map(promoProductIds.map((id, i) => [id, i]));
        products = ((data ?? []) as { id: string }[])
          .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
          .slice(0, 12);
      }

      if (promoShopIds.length > 0) {
        const { data, error: shopError } = await supabase
          .from("shops")
          .select("*")
          .in("id", promoShopIds)
          .eq("status", "approved");
        if (shopError) throw shopError;
        const rank = new Map(promoShopIds.map((id, i) => [id, i]));
        shops = ((data ?? []) as { id: string }[])
          .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
          .slice(0, 8);
      }

      return { products, shops };
    });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load promotions." });
  }
});

/** Seller: request promotion for the whole shop or one product. */
router.post("/", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const rawProductId = req.body?.product_id;
  const productId = typeof rawProductId === "string" && rawProductId.trim() ? rawProductId.trim() : null;
  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";

  if (note.length > MAX_NOTE_LENGTH) {
    return res.status(400).json({ error: "Note must be under 300 characters." });
  }

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, status")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) {
    return res.status(400).json({ error: "Please create your shop before requesting a promotion." });
  }
  if (shop.status !== "approved") {
    return res.status(403).json({ error: "Only approved shops can request a promotion." });
  }

  if (productId) {
    const { data: product } = await supabase
      .from("products")
      .select("id, is_active")
      .eq("id", productId)
      .eq("shop_id", shop.id)
      .maybeSingle();

    if (!product) return res.status(404).json({ error: "Product not found in your shop." });
    if (!product.is_active) {
      return res.status(400).json({ error: "Only visible products can be promoted." });
    }
  }

  const { data: existing } = await supabase
    .from("promotions")
    .select("id, product_id")
    .eq("shop_id", shop.id)
    .eq("status", "requested");

  if ((existing ?? []).some((row) => (row.product_id ?? null) === productId)) {
    return res.status(409).json({ error: "You already have a pending request for this." });
  }

  const { error } = await supabase.from("promotions").insert({
    shop_id: shop.id,
    product_id: productId,
    note: note || null,
    status: "requested",
  });

  if (error) return res.status(500).json({ error: error.message });
  clearCache();
  return res.status(201).json({ ok: true });
});

/** Seller: list own promotion requests with product names. */
router.get("/mine", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.json({ promotions: [] });

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const rows = data ?? [];
  const productIds = [...new Set(rows.map((row) => row.product_id).filter((id): id is string => Boolean(id)))];
  const productNames = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds);
    for (const product of products ?? []) {
      productNames.set(product.id, product.name);
    }
  }

  return res.json({
    promotions: rows.map((row) => ({
      ...row,
      product_name: row.product_id ? (productNames.get(row.product_id) ?? null) : null,
    })),
  });
});

/** Admin: list every promotion request with shop/product names. */
router.get("/requests", requireAuth, requireRole(["admin", "superadmin"]), async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const rows = data ?? [];
  const shopIds = [...new Set(rows.map((row) => row.shop_id))];
  const productIds = [...new Set(rows.map((row) => row.product_id).filter((id): id is string => Boolean(id)))];

  const shopInfo = new Map<string, { name: string; slug: string }>();
  if (shopIds.length > 0) {
    const { data: shops } = await supabase
      .from("shops")
      .select("id, name, slug")
      .in("id", shopIds);
    for (const shop of shops ?? []) {
      shopInfo.set(shop.id, { name: shop.name, slug: shop.slug });
    }
  }

  const productNames = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds);
    for (const product of products ?? []) {
      productNames.set(product.id, product.name);
    }
  }

  return res.json({
    promotions: rows.map((row) => ({
      ...row,
      shop_name: shopInfo.get(row.shop_id)?.name ?? null,
      shop_slug: shopInfo.get(row.shop_id)?.slug ?? null,
      product_name: row.product_id ? (productNames.get(row.product_id) ?? null) : null,
    })),
  });
});

/** Admin: approve (time-boxed), reject, or expire a promotion. */
router.patch("/:id", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { decision, duration_days, decision_note } = req.body ?? {};
  if (!["approve", "reject", "expire"].includes(decision)) {
    return res.status(400).json({ error: "Invalid decision." });
  }

  const note = typeof decision_note === "string" ? decision_note.trim() : "";
  if (note.length > MAX_NOTE_LENGTH) {
    return res.status(400).json({ error: "Decision note must be under 300 characters." });
  }

  const duration = Number(duration_days ?? DEFAULT_DURATION_DAYS);
  if (decision === "approve" && (!Number.isInteger(duration) || duration < 1 || duration > MAX_DURATION_DAYS)) {
    return res.status(400).json({ error: "Duration must be between 1 and 90 days." });
  }

  const supabase = getSupabaseAdmin();
  const { data: promo } = await supabase
    .from("promotions")
    .select("id, status")
    .eq("id", String(req.params.id))
    .maybeSingle();

  if (!promo) return res.status(404).json({ error: "Promotion request not found." });

  const allowedFrom: Record<string, string[]> = {
    approve: ["requested", "expired"],
    reject: ["requested"],
    expire: ["approved"],
  };
  if (!allowedFrom[decision].includes(promo.status)) {
    return res.status(400).json({ error: `Cannot ${decision} a ${promo.status} promotion.` });
  }

  const now = new Date();
  const patch: Record<string, unknown> = {
    status: decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "expired",
    decision_note: note || null,
    decided_by: req.user.id,
    decided_at: now.toISOString(),
  };
  if (decision === "approve") {
    patch.starts_at = now.toISOString();
    patch.ends_at = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString();
  }

  const { error } = await supabase
    .from("promotions")
    .update(patch)
    .eq("id", promo.id);

  if (error) return res.status(500).json({ error: error.message });
  clearCache();
  return res.json({ ok: true });
});

export default router;
