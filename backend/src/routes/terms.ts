import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router: Router = express.Router();

router.use(requireAuth);

/** Record terms acceptance for the current user. */
router.post("/accept", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { version } = req.body ?? {};
  const termsVersion = typeof version === "string" ? version : "1";

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("terms_acceptances").insert({
    user_id: req.user.id,
    version: termsVersion,
  } as never);

  if (error) {
    // Ignore duplicate key errors (user already accepted this version)
    if (error.code === "23505") {
      return res.json({ ok: true, duplicate: true });
    }
    return res.status(500).json({ error: error.message });
  }

  return res.json({ ok: true });
});

export default router;