import { getSupabaseAdmin } from "./supabase.js";

let approvalColumn: boolean | null = null;

/**
 * Whether the products.approval_status column exists (checked once per
 * backend lifetime). Public reads only filter on it when present, so the
 * marketplace keeps working before the approval migration runs.
 */
export async function hasApprovalColumn(): Promise<boolean> {
  if (approvalColumn !== null) return approvalColumn;
  try {
    const { error } = await getSupabaseAdmin()
      .from("products")
      .select("approval_status")
      .limit(1);
    approvalColumn = !error;
  } catch {
    approvalColumn = false;
  }
  return approvalColumn;
}
