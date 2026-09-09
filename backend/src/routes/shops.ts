import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { cached, clearCache } from "../lib/cache.js";
import { summarize, type ReviewRow } from "../lib/reviews.js";
import { slugify } from "../lib/utils.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

router.get("/reviews/:slug", async (req, res) => {
  const slug = String(req.params.slug);

  let result;
  try {
    result = await cached(`shops:reviews:${slug}`, async () => {
    const supabase = getSupabaseAdmin();
    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();

    if (!shop) return null;

    const { data, error } = await supabase
      .from("orders")
      .select("rating, feedback, feedback_at, buyer_id")
      .eq("shop_id", shop.id)
      .eq("status", "delivered")
      .gt("rating", 0);

    if (error) throw error;

    return summarize((data ?? []) as ReviewRow[]);
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load reviews." });
  }

  if (result === null) {
    return res.status(404).json({ error: "Shop not found." });
  }
  return res.json(result);
});

router.get("/marketplace", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const shops = await cached("shops:marketplace", async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    });

    return res.json({ shops });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load shops." });
  }
});

router.get("/:slug", async (req, res) => {
  const slug = String(req.params.slug);

  try {
    const supabase = getSupabaseAdmin();
    const data = await cached(`shops:slug:${slug}`, async () => {
      const { data: shop, error } = await supabase
        .from("shops")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();

      if (error) throw error;
      if (!shop) return null;

      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", shop.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      return { shop, products: products ?? [] };
    });

    if (!data) return res.status(404).json({ error: "Shop not found." });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load the shop." });
  }
});

router.get("/owner/:ownerId", async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", req.params.ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ shop: data ?? null });
});

router.post("/", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { name, slug, tagline, delivery_charge } = req.body ?? {};
  if (!name || !slug) {
    return res.status(400).json({ error: "Name and shop URL are required." });
  }

  const parsedSlug = slugify(String(slug));
  if (!parsedSlug) return res.status(400).json({ error: "Invalid shop URL." });

  const charge = Number(delivery_charge ?? 0);
  if (!Number.isFinite(charge) || charge < 0) {
    return res.status(400).json({ error: "Please enter a valid delivery charge." });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("shops").insert({
    owner_id: req.user.id,
    name,
    slug: parsedSlug,
    tagline: tagline || null,
    delivery_charge: charge,
    status: "pending",
  });

  if (error) {
    return res.status(409).json({ error: "That shop URL is already taken. Try a different one." });
  }
  clearCache();
  return res.status(201).json({ ok: true });
});

router.put("/:id", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { name, tagline, description, delivery_charge, return_policy, logo_url, banner_url } = req.body ?? {};
  const charge = Number(delivery_charge ?? 0);
  if (!Number.isFinite(charge) || charge < 0) {
    return res.status(400).json({ error: "Please enter a valid delivery charge." });
  }

  const policy = typeof return_policy === "string" ? return_policy.trim() : "";
  if (policy.length > 500) {
    return res.status(400).json({ error: "Return policy must be under 500 characters." });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("shops")
    .update({
      name: name || undefined,
      tagline: tagline || null,
      description: description || null,
      delivery_charge: charge,
      return_policy: policy || null,
      logo_url: logo_url || null,
      banner_url: banner_url || null,
    })
    .eq("id", String(req.params.id))
    .eq("owner_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  clearCache();
  return res.json({ ok: true });
});

export default router;