import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

const ALLOWED_ROLES = ["buyer", "seller", "admin", "superadmin"];

/** List the signed-in user's saved products, newest first. */
router.get("/", requireAuth, requireRole(ALLOWED_ROLES), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("wishlists")
    .select(
      "product_id, created_at, product:products(*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status))",
    )
    .eq("buyer_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    items: ((data ?? []) as { product: unknown }[]).filter((row) => row.product),
  });
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
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return res.status(404).json({ error: "Product not found." });

  const { data: existing } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("buyer_id", req.user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("buyer_id", req.user.id)
      .eq("product_id", productId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, wished: false });
  }

  const { error } = await supabase.from("wishlists").insert({
    buyer_id: req.user.id,
    product_id: productId,
  });

  // A concurrent toggle may have inserted the row first — still wished.
  if (error && error.code !== "23505") {
    return res.status(500).json({ error: error.message });
  }
  return res.json({ ok: true, wished: true });
});

export default router;
