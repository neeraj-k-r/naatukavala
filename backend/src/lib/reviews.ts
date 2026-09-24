import { getSupabaseAdmin } from "./supabase.js";

export interface ReviewRow {
  order_id: string;
  rating: number | null;
  feedback: string | null;
  feedback_at: string | null;
  buyer_id: string;
}

export interface PublicReview {
  order_id: string;
  rating: number;
  feedback: string | null;
  images: string[];
  helpful_count: number;
  created_at: string;
  buyer_name: string | null;
}

export interface ReviewSummary {
  average: number | null;
  count: number;
  distribution: { stars: number; count: number }[];
  reviews: PublicReview[];
}

const FIVE_STARS = [5, 4, 3, 2, 1];

async function buyerNames(ids: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(ids)];
  if (uniq.length === 0) return new Map();

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", uniq);

  return new Map((data ?? []).map((profile) => [profile.id, profile.full_name]));
}

/** Aggregate raw rated-order rows into a public review summary. */
export async function summarize(rows: ReviewRow[]): Promise<ReviewSummary> {
  if (rows.length === 0) {
    return {
      average: null,
      count: 0,
      distribution: FIVE_STARS.map((stars) => ({ stars, count: 0 })),
      reviews: [],
    };
  }

  const names = await buyerNames(rows.map((row) => row.buyer_id));
  const images = await reviewImages(rows.map((row) => row.order_id));
  const total = rows.reduce(
    (sum, row) => sum + (row.rating ?? 0),
    0,
  );
  const average = Math.round((total / rows.length) * 10) / 10;

  const distribution = FIVE_STARS.map((stars) => ({
    stars,
    count: rows.filter((row) => row.rating === stars).length,
  }));

  const reviews: PublicReview[] = [...rows]
    .filter((row) => row.rating !== null)
    .sort((a, b) =>
      (b.feedback_at ?? "").localeCompare(a.feedback_at ?? ""),
    )
    .slice(0, 20)
    .map((row) => ({
      order_id: row.order_id,
      rating: row.rating ?? 0,
      feedback: row.feedback,
      images: images.get(row.order_id) ?? [],
      helpful_count: 0,
      created_at: row.feedback_at ?? "",
      buyer_name: names.get(row.buyer_id) ?? null,
    }));

  return { average, count: rows.length, distribution, reviews };
}

/**
 * Photos attached to each order's feedback. Fails closed to empty when the
 * photo column hasn't been migrated yet.
 */
async function reviewImages(orderIds: string[]): Promise<Map<string, string[]>> {
  const uniq = [...new Set(orderIds)].filter(Boolean);
  if (uniq.length === 0) return new Map();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id, feedback_images")
    .in("id", uniq);

  if (error) return new Map();
  return new Map(
    ((data ?? []) as { id: string; feedback_images: string[] | null }[]).map(
      (row) => [row.id, row.feedback_images ?? []],
    ),
  );
}