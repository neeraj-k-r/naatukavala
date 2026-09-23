import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

const ALLOWED_ROLES = ["buyer", "seller", "admin", "superadmin"];

/**
 * True when PostgREST complains about the price-alert columns — i.e. the
 * 20260921 migration hasn't been run yet. Callers fall back to the plain
 * wishlist behavior instead of failing.
 */
function isMissingPriceColumn(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  const message = (err as { message?: unknown })?.message;
  return (
    code === "PGRST204" ||
    (typeof message === "string" &&
      /price_at_save|notified_price/.test(message))
  );
}

/** List the signed-in user's saved products, newest first. */
router.get("/", requireAuth, requireRole(ALLOWED_ROLES), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const fullSelect =
    "product_id, created_at, price_at_save, notified_price, product:products(*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status))";
  const legacySelect =
    "product_id, created_at, product:products(*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status))";

  let query = supabase
    .from("wishlists")
    .select(fullSelect)
    .eq("buyer_id", req.user.id)
    .order("created_at", { ascending: false });
  let { data, error } = await query;

  if (error && isMissingPriceColumn(error)) {
    ({ data, error } = await supabase
      .from("wishlists")
      .select(legacySelect)
      .eq("buyer_id", req.user.id)
      .order("created_at", { ascending: false }));
  }

  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    items: ((data ?? []) as { product: unknown }[]).filter((row) => row.product),
  });
});

/**
 * Price drops on saved items: current price below the save-time baseline
 * and below any previously notified price. Pass ?notify=1 to mark the
 * returned drops as notified (viewing the wishlist does this).
 */
router.get("/drops", requireAuth, requireRole(ALLOWED_ROLES), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const mark = req.query.notify === "1";
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("wishlists")
    .select(
      "product_id, price_at_save, notified_price, product:products!inner(*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status))",
    )
    .eq("buyer_id", req.user.id)
    .eq("product.is_active", true)
    .eq("product.shop.status", "approved");

  // No baseline columns yet — no drops to report, not an error.
  if (error) {
    if (isMissingPriceColumn(error)) return res.json({ drops: [] });
    return res.status(500).json({ error: error.message });
  }

  type DropRow = {
    product_id: string;
    price_at_save: number | string | null;
    notified_price: number | string | null;
    product: { id: string; price: number | string } & Record<string, unknown>;
  };

  const drops: {
    product_id: string;
    old_price: number;
    new_price: number;
    percent_off: number;
    product: unknown;
  }[] = [];

  for (const row of ((data ?? []) as unknown as DropRow[])) {
    if (!row.product) continue;
    const current = Number(row.product.price);
    const baseline =
      row.price_at_save === null ? current : Number(row.price_at_save);
    const notified =
      row.notified_price === null ? null : Number(row.notified_price);
    if (
      Number.isFinite(current) &&
      baseline > 0 &&
      current < baseline &&
      (notified === null || current < notified)
    ) {
      drops.push({
        product_id: row.product_id,
        old_price: baseline,
        new_price: current,
        percent_off: Math.round((1 - current / baseline) * 100),
        product: row.product,
      });
    }
  }

  drops.sort((a, b) => b.percent_off - a.percent_off);

  if (mark && drops.length > 0) {
    await Promise.all(
      drops.map((drop) =>
        supabase
          .from("wishlists")
          .update({ notified_price: drop.new_price })
          .eq("buyer_id", req.user!.id)
          .eq("product_id", drop.product_id),
      ),
    );
  }

  return res.json({ drops });
});

/** Toggle a product in the signed-in user's wishlist. */
router.post("/", requireAuth, requireRole(ALLOWED_ROLES), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const productId =
    typeof req.body?.product_id === "string" ? req.body.product_id.trim() : "";
  if (!productId) {
    return res.status(400).json({ error: "Product is required." });
  }

  const supabase = getSupabaseAdmin();
  // Independent lookups — run together to save a ~400ms roundtrip.
  const [{ data: product }, { data: existing }] = await Promise.all([
    supabase.from("products").select("id, price").eq("id", productId).maybeSingle(),
    supabase
      .from("wishlists")
      .select("product_id")
      .eq("buyer_id", req.user.id)
      .eq("product_id", productId)
      .maybeSingle(),
  ]);

  if (!product) return res.status(404).json({ error: "Product not found." });

  if (existing) {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("buyer_id", req.user.id)
      .eq("product_id", productId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, wished: false });
  }

  let { error } = await supabase.from("wishlists").insert({
    buyer_id: req.user.id,
    product_id: productId,
    price_at_save: Number((product as { price: number }).price),
  });

  // Price-alert columns not migrated yet — save without the baseline.
  if (error && isMissingPriceColumn(error)) {
    ({ error } = await supabase.from("wishlists").insert({
      buyer_id: req.user.id,
      product_id: productId,
    }));
  }

  // A concurrent toggle may have inserted the row first — still wished.
  if (error && error.code !== "23505") {
    return res.status(500).json({ error: error.message });
  }
  return res.json({ ok: true, wished: true });
});

export default router;
