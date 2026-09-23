import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { getSupabaseAdmin } from "../lib/supabase.js";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  profile: {
    id: string;
    full_name: string;
    role: string;
    phone: string | null;
    address: string | null;
  } | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Short-lived cache of verified tokens: token validation + profile lookup
// cost ~900ms of Supabase roundtrips, paid on EVERY authenticated call
// without this. 60s TTL keyed by token hash — revocation/role changes take
// up to a minute to propagate, a standard tradeoff. Only successes cached.
const TOKEN_TTL_MS = 60_000;
const MAX_TOKEN_ENTRIES = 1000;
const tokenCache = new Map<string, { user: AuthUser; expires: number }>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function pruneTokenCache() {
  if (tokenCache.size <= MAX_TOKEN_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of tokenCache) {
    if (entry.expires <= now) tokenCache.delete(key);
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header." });
  }

  const token = header.slice(7);
  const cacheKey = hashToken(token);
  const hit = tokenCache.get(cacheKey);
  if (hit && hit.expires > Date.now()) {
    req.user = hit.user;
    return next();
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  req.user = {
    id: data.user.id,
    email: data.user.email ?? "",
    // Never trust user_metadata for authorization: it is client-writable at
    // signup. The profiles table (guarded by RLS + escalation trigger) is the
    // only source of truth for roles.
    role: profile?.role ?? "buyer",
    profile: profile ?? null,
  };

  pruneTokenCache();
  tokenCache.set(cacheKey, { user: req.user, expires: Date.now() + TOKEN_TTL_MS });

  next();
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    if (!roles.includes(req.user.profile?.role ?? req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }
    next();
  };
}
