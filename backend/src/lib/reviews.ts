import { getSupabaseAdmin } from "./supabase.js";

export interface ReviewRow {
  rating: number | null;
  feedback: string | null;
  feedback_at: string | null;
  buyer_id: string;
}

export interface PublicReview {
  rating: number;
  feedback: string | null;
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
      rating: row.rating ?? 0,
      feedback: row.feedback,
      created_at: row.feedback_at ?? "",
      buyer_name: names.get(row.buyer_id) ?? null,
    }));

  return { average, count: rows.length, distribution, reviews };
}