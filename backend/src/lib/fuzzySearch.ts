import { getSupabaseAdmin } from "./supabase.js";
import { hasApprovalColumn, variantJoin } from "./productApproval.js";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

/** Classic Levenshtein edit distance (case already normalized by callers). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  // Keep the shorter string on the inner axis.
  if (a.length > b.length) [a, b] = [b, a];
  let prev = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let corner = prev[0];
    prev[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const upper = prev[i];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[i] = Math.min(prev[i] + 1, prev[i - 1] + 1, corner + cost);
      corner = upper;
    }
  }
  return prev[a.length];
}

/** 0..1 similarity from edit distance (1 = identical). */
function wordSimilarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
}

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * How well a search term matches a haystack (product name + description +
 * category + shop name). Exact containment scores 1; otherwise every term
 * token must resemble some haystack word (worst-token score wins), so
 * "muringakollll" still finds "MURINGAKOL" but unrelated text does not.
 */
export function fuzzyScore(term: string, haystack: string): number {
  const cleanTerm = normalize(term);
  const cleanHay = normalize(haystack);
  if (!cleanTerm || !cleanHay) return 0;
  if (cleanHay.includes(cleanTerm)) return 1;

  const termTokens = cleanTerm.split(" ").filter(Boolean);
  const hayWords = cleanHay.split(" ").filter(Boolean);
  if (termTokens.length === 0 || hayWords.length === 0) return 0;

  let worst = 1;
  for (const token of termTokens) {
    // Cheap win: a haystack word containing the token (or vice versa).
    let best = 0;
    for (const word of hayWords) {
      if (word.includes(token) || token.includes(word)) {
        best = 1;
        break;
      }
      const score = wordSimilarity(token, word);
      if (score > best) best = score;
    }
    if (best < worst) worst = best;
  }
  return worst;
}

export interface ProductSearchFilters {
  search?: string;
  category?: string;
  shopSlug?: string;
  limit?: number;
}

const FUZZY_THRESHOLD = 0.6;
const FUZZY_CANDIDATES = 200;
const FUZZY_MAX_RESULTS = 24;

function haystackOf(row: {
  name?: unknown;
  description?: unknown;
  category?: unknown;
  shop?: unknown;
}): string {
  const shop = row.shop as { name?: unknown } | null | undefined;
  return [row.name, row.description, row.category, shop?.name]
    .filter((part): part is string => typeof part === "string")
    .join(" ");
}

/**
 * Product search with a typo-tolerant fallback: exact substring match first
 * (unchanged behaviour), then — only when nothing matches — fuzzy matching
 * over name/description/category/shop name so near-misses still return.
 */
export async function searchProducts(
  supabase: SupabaseAdmin,
  filters: ProductSearchFilters,
): Promise<unknown[]> {
  const search = filters.search?.trim() ?? "";
  const vj = await variantJoin();
  const approval = await hasApprovalColumn();

  const applyBase = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    let q = query
      .eq("is_active", true)
      .eq("shop.status", "approved");
    if (approval) q = q.eq("approval_status", "approved");
    if (filters.category) q = q.eq("category", filters.category);
    if (filters.shopSlug) q = q.eq("shop.slug", filters.shopSlug);
    return q;
  };

  if (search) {
    let exact = supabase
      .from("products")
      .select(`*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status, banner_url)${vj}`);
    exact = applyBase(exact);
    exact = exact.ilike("name", `%${search}%`);
    if (filters.limit) exact = exact.limit(Number(filters.limit));
    exact = exact.order("created_at", { ascending: false });
    const { data, error } = await exact;
    if (error) throw error;
    if (data && data.length > 0) return data;
  }

  // Exact path (or empty search): return the plain filtered list.
  if (!search) {
    let query = supabase
      .from("products")
      .select(`*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status, banner_url)${vj}`);
    query = applyBase(query);
    if (filters.limit) query = query.limit(Number(filters.limit));
    query = query.order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  // Fuzzy fallback: rank a bounded candidate set in JS.
  let candidates = supabase
    .from("products")
    .select(`*, shop:shops!inner(name, slug, delivery_charge, return_policy, verification_status, banner_url)${vj}`);
  candidates = applyBase(candidates);
  candidates = candidates.order("created_at", { ascending: false }).limit(FUZZY_CANDIDATES);
  const { data, error } = await candidates;
  if (error) throw error;

  const ranked = ((data ?? []) as unknown as Record<string, unknown>[])
    .map((row) => ({
      row,
      score: fuzzyScore(search, haystackOf(row as never)),
    }))
    .filter((entry) => entry.score >= FUZZY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, filters.limit ? Number(filters.limit) : FUZZY_MAX_RESULTS)
    .map((entry) => entry.row);
  return ranked;
}
