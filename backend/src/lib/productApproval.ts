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

let variantsTable: boolean | null = null;

/**
 * Whether product_variants exists (checked once). Reads embed the join
 * only when present, so catalog endpoints survive before migration.
 */
export async function hasVariantsTable(): Promise<boolean> {
  if (variantsTable !== null) return variantsTable;
  try {
    const { error } = await getSupabaseAdmin()
      .from("product_variants")
      .select("id")
      .limit(1);
    variantsTable = !error;
  } catch {
    variantsTable = false;
  }
  return variantsTable;
}

/** Embed snippet for variant joins, empty when the table is missing. */
export async function variantJoin(): Promise<string> {
  return (await hasVariantsTable()) ? ", variants:product_variants(*)" : "";
}
