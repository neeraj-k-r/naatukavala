import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

const ALLOWED_ROLES = ["buyer", "seller", "admin", "superadmin"];
const MAX_IDS = 50;

/** True when the votes table hasn't been migrated yet. */
function isMissingTable(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  const message = (err as { message?: unknown })?.message;
  return (
    code === "PGRST205" ||
    (typeof message === "string" && /review_votes/.test(message))
  );
}

async function helpfulCount(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  orderId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("review_votes")
    .select("order_id")
    .eq("order_id", orderId);
  if (error) return 0;
  return (data ?? []).length;
}

/** Toggle the signed-in user's helpful vote on a review (order). */
router.post(
  "/:orderId/helpful",
  requireAuth,
  requireRole(ALLOWED_ROLES),
  async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated." });

    const orderId = String(req.params.orderId);
    const supabase = getSupabaseAdmin();

    const { data: order } = await supabase
      .from("orders")
      .select("id, rating")
      .eq("id", orderId)
      .maybeSingle();

    if (!order || !order.rating) {
      return res.status(404).json({ error: "Review not found." });
    }

    const { data: existing } = await supabase
      .from("review_votes")
      .select("order_id")
      .eq("order_id", orderId)
      .eq("voter_id", req.user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("review_votes")
        .delete()
        .eq("order_id", orderId)
        .eq("voter_id", req.user.id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({
        ok: true,
        helpful: false,
        count: await helpfulCount(supabase, orderId),
      });
    }

    const { error } = await supabase.from("review_votes").insert({
      order_id: orderId,
      voter_id: req.user.id,
    });
    if (error) {
      if (isMissingTable(error)) return res.json({ ok: false });
      return res.status(500).json({ error: error.message });
    }
    return res.json({
      ok: true,
      helpful: true,
      count: await helpfulCount(supabase, orderId),
    });
  },
);

/** Order ids (capped) the signed-in user marked helpful. */
router.get(
  "/voted",
  requireAuth,
  requireRole(ALLOWED_ROLES),
  async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated." });

    const raw = String(req.query.order_ids ?? "");
    const ids = [...new Set(raw.split(",").map((id) => id.trim()).filter(Boolean))].slice(
      0,
      MAX_IDS,
    );
    if (ids.length === 0) return res.json({ voted: [] });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("review_votes")
      .select("order_id")
      .eq("voter_id", req.user.id)
      .in("order_id", ids);

    if (error) {
      if (isMissingTable(error)) return res.json({ voted: [] });
      return res.status(500).json({ error: error.message });
    }
    return res.json({
      voted: ((data ?? []) as { order_id: string }[]).map((row) => row.order_id),
    });
  },
);

export default router;
