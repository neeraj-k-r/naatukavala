import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { cached, clearCache } from "../lib/cache.js";
import { hasApprovalColumn } from "../lib/productApproval.js";
import { summarize, type ReviewRow } from "../lib/reviews.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

/** Verified shops (and admins) skip review; everyone else queues every time. */
function needsProductReview(
  req: { user?: { profile?: { role?: string } | null } | undefined },
  shop: { verification_status?: string | null },
): boolean {
  if (
    req.user?.profile?.role === "admin" ||
    req.user?.profile?.role === "superadmin"
  ) {
    return false;
  }
  return shop.verification_status !== "verified";
}

/** True when the approval column hasn't been migrated yet. */
function isMissingApprovalColumn(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  const message = (err as { message?: unknown })?.message;
  return (
    code === "PGRST204" ||
    (typeof message === "string" && /approval_status/.test(message))
  );
}

/** True when a table hasn't been migrated yet. */
function isMissingTable(err: unknown, table: string): boolean {
  const code = (err as { code?: unknown })?.code;
  const message = (err as { message?: unknown })?.message;
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    (typeof message === "string" && message.includes(table))
  );
}

interface VariantInput {
  option_name: string;
  option_value: string;
  price: number;
  stock: number;
}

const MAX_VARIANTS = 20;

/** Validates the variants payload (array or JSON string). */
function parseVariants(raw: unknown): VariantInput[] | { error: string } {
  if (raw === undefined || raw === null || raw === "") return [];
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return { error: "Variants are invalid." };
    }
  }
  if (!Array.isArray(arr)) return { error: "Variants are invalid." };
  if (arr.length > MAX_VARIANTS) {
    return { error: "At most 20 variants per product." };
  }
  const seen = new Set<string>();
  const out: VariantInput[] = [];
  for (const item of arr) {
    const v = item as Record<string, unknown>;
    const option_name = String(v.option_name ?? "").trim().slice(0, 50);
    const option_value = String(v.option_value ?? "").trim().slice(0, 50);
    const price = Number(v.price);
    const stock = Math.floor(Number(v.stock ?? 0));
    if (!option_name || !option_value) {
      return { error: "Each variant needs an option name and value." };
    }
    if (!Number.isFinite(price) || price < 0) {
      return { error: "Variant prices must be zero or more." };
    }
    if (!Number.isInteger(stock) || stock < 0) {
      return { error: "Variant stock must be zero or more." };
    }
    const key = `${option_name.toLowerCase()}|${option_value.toLowerCase()}`;
    if (seen.has(key)) return { error: "Duplicate variant options." };
    seen.add(key);
    out.push({ option_name, option_value, price, stock });
  }
  return out;
}

/**
 * Replaces a product's variant set. Returns an error message when the
 * variants table hasn't been migrated yet and variants were requested.
 */
async function replaceVariants(
  productId: string,
  variants: VariantInput[],
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);
  if (deleteError && !isMissingTable(deleteError, "product_variants")) {
    return deleteError.message;
  }
  if (variants.length === 0) return null;
  const { error: insertError } = await supabase
    .from("product_variants")
    .insert(
      variants.map((v) => ({
        product_id: productId,
        option_name: v.option_name,
        option_value: v.option_value,
        price: v.price,
        stock: v.stock,
        is_active: true,
      })),
    );
  if (insertError) {
    if (isMissingTable(insertError, "product_variants")) {
      return "Variants are not available right now.";
    }
    return insertError.message;
  }
  return null;
}

router.get("/reviews/:productId", async (req, res) => {
  const id = String(req.params.productId);

  let result;
  try {
    result = await cached(`product-reviews:${id}`, async () => {
    const supabase = getSupabaseAdmin();
    const { data: product } = await supabase
      .from("products")
      .select("id, shop:shops!inner(status)")
      .eq("id", id)
      .eq("shop.status", "approved")
      .maybeSingle();

    if (!product) return null;

    const { data, error } = await supabase
      .from("order_items")
      .select("order_id, orders!inner(id, buyer_id, rating, feedback, feedback_at)")
      .eq("product_id", id)
      .eq("orders.status", "delivered")
      .gt("orders.rating", 0);

    if (error) throw error;

    type RatedOrder = {
      buyer_id: string;
      rating: number | null;
      feedback: string | null;
      feedback_at: string | null;
    };
    const raw = (data ?? []) as unknown as {
      order_id: string;
      orders: RatedOrder | RatedOrder[];
    }[];

    const rows: ReviewRow[] = raw.map((item) => {
      const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
      return {
        order_id: String(item.order_id ?? ""),
        rating: Number(order?.rating ?? 0),
        feedback: order?.feedback ?? null,
        feedback_at: order?.feedback_at ?? null,
        buyer_id: String(order?.buyer_id ?? ""),
      };
    });

    return summarize(rows);
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load reviews." });
  }

  if (result === null) {
    return res.status(404).json({ error: "Product not found." });
  }
  return res.json(result);
});

router.get("/marketplace", async (req, res) => {
  const { search, category, shopSlug, limit } = req.query as Record<string, string | undefined>;

  try {
    const supabase = getSupabaseAdmin();

    const key = [
      "marketplace",
    search?.trim() ?? "",
    category ?? "",
    shopSlug ?? "",
    limit ?? "",
  ].join("|");

  const products = await cached(key, async () => {
    let query = supabase
      .from("products")
      .select("*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status)")
      .eq("is_active", true)
      .eq("shop.status", "approved");

    if (await hasApprovalColumn()) query = query.eq("approval_status", "approved");
    if (category) query = query.eq("category", category);
    if (shopSlug) query = query.eq("shop.slug", shopSlug);
    if (search && search.trim()) query = query.ilike("name", `%${search.trim()}%`);
    if (limit) query = query.limit(Number(limit));
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  });

  return res.json({ products });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load products." });
  }
});

router.get("/categories", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const categories = await cached("categories", async () => {
      let query = supabase
        .from("products")
        .select("category, shop:shops!inner(status)")
        .eq("is_active", true)
        .eq("shop.status", "approved")
        .not("category", "is", null);

      if (await hasApprovalColumn()) query = query.eq("approval_status", "approved");

      const { data, error } = await query;

      if (error) throw error;

      return [...new Set(
        ((data ?? []) as { category: string | null }[])
          .map((row) => row.category)
          .filter(Boolean)
          .sort(),
      )] as string[];
    });

    return res.json({ categories });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load categories." });
  }
});

router.get("/owner", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.json({ products: [] });

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ products: data ?? [] });
});

router.get("/:id", async (req, res) => {
  const id = String(req.params.id);

  try {
    const supabase = getSupabaseAdmin();
    const product = await cached(`product:${id}`, async () => {
      let query = supabase
        .from("products")
        .select("*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status)")
        .eq("id", id)
        .eq("shop.status", "approved");

      if (await hasApprovalColumn()) query = query.eq("approval_status", "approved");

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data ?? null;
    });

    if (!product) return res.status(404).json({ error: "Product not found." });
    return res.json({ product });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load the product." });
  }
});

router.post("/", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { name, price, stock, category, description, images } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "Product name is required." });

  const variants = parseVariants(req.body?.variants);
  if (!Array.isArray(variants)) {
    return res.status(400).json({ error: variants.error });
  }

  const parsedPrice = Number(price);
  const parsedStock = Number(stock ?? 0);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: "Please enter a valid price." });
  }

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, verification_status")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) {
    return res.status(400).json({ error: "Please create your shop before adding products." });
  }

  // Verified sellers go live instantly; everyone else queues for review —
  // every single new product needs admin approval.
  const approval_status = needsProductReview(req, shop) ? "pending" : "approved";

  let { data: created, error } = await supabase.from("products").insert({
    shop_id: shop.id,
    name,
    price: parsedPrice,
    stock: parsedStock,
    category: category || null,
    description: description || null,
    images: Array.isArray(images) ? images : [],
    is_active: true,
    approval_status,
  }).select("id").single();

  // Approval column not migrated yet — save without it.
  if (error && isMissingApprovalColumn(error)) {
    ({ data: created, error } = await supabase.from("products").insert({
      shop_id: shop.id,
      name,
      price: parsedPrice,
      stock: parsedStock,
      category: category || null,
      description: description || null,
      images: Array.isArray(images) ? images : [],
      is_active: true,
    }).select("id").single());
  }

  if (error || !created) return res.status(500).json({ error: error?.message ?? "Could not create the product." });

  const variantsError = await replaceVariants(created.id, variants);
  if (variantsError) {
    await supabase.from("products").delete().eq("id", created.id);
    return res.status(500).json({ error: variantsError });
  }

  clearCache();
  return res.status(201).json({ ok: true, approval_status });
});

router.put("/:id", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { name, price, stock, category, description, is_active, images } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "Product name is required." });

  const variants = parseVariants(req.body?.variants);
  if (!Array.isArray(variants)) {
    return res.status(400).json({ error: variants.error });
  }

  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: "Please enter a valid price." });
  }

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, verification_status")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.status(400).json({ error: "Please create your shop before adding products." });

  // Ownership check first: the scoped update below is silent on zero rows,
  // and variant replacement must never touch another shop's product.
  const { data: owned } = await supabase
    .from("products")
    .select("id")
    .eq("id", String(req.params.id))
    .eq("shop_id", shop.id)
    .maybeSingle();
  if (!owned) return res.status(404).json({ error: "Product not found." });

  // Edits from unverified sellers go back to the review queue as well.
  const approval_status = needsProductReview(req, shop) ? "pending" : "approved";

  let { error } = await supabase
    .from("products")
    .update({
      name,
      price: parsedPrice,
      stock: Number(stock ?? 0),
      category: category || null,
      description: description || null,
      is_active: is_active === undefined ? true : Boolean(is_active),
      images: Array.isArray(images) ? images : [],
      approval_status,
    })
    .eq("id", String(req.params.id))
    .eq("shop_id", shop.id);

  if (error && isMissingApprovalColumn(error)) {
    ({ error } = await supabase
      .from("products")
      .update({
        name,
        price: parsedPrice,
        stock: Number(stock ?? 0),
        category: category || null,
        description: description || null,
        is_active: is_active === undefined ? true : Boolean(is_active),
        images: Array.isArray(images) ? images : [],
      })
      .eq("id", String(req.params.id))
      .eq("shop_id", shop.id));
  }

  if (error) return res.status(500).json({ error: error.message });

  const productId = String(req.params.id);
  const variantsError = await replaceVariants(productId, variants);
  if (variantsError) return res.status(500).json({ error: variantsError });

  clearCache();
  return res.json({ ok: true, approval_status });
});

router.delete("/:id", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.status(400).json({ error: "Shop not found." });

  const productId = String(req.params.id);
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("shop_id", shop.id);

  if (error) {
    if (error.message.includes("foreign key constraint") || error.code === "23503") {
      const { error: softError } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", productId)
        .eq("shop_id", shop.id);

      if (softError) return res.status(500).json({ error: softError.message });
      clearCache();
      return res.json({ ok: true, soft: true });
    }
    return res.status(500).json({ error: error.message });
  }

  clearCache();
  return res.json({ ok: true });
});

export default router;