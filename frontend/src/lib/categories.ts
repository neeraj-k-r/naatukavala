/**
 * The predefined product category list every seller picks from, so the
 * marketplace stays generalized instead of free-text chaos. "Other" lets
 * sellers type a custom category when nothing fits.
 */
export const PRODUCT_CATEGORIES = [
  "Grocery",
  "Vegetables & Fruits",
  "Dairy",
  "Spices & Grains",
  "Stationery",
  "Books",
  "Clothing",
  "Footwear",
  "Beauty & Personal Care",
  "Home & Kitchen",
  "Furniture",
  "Electronics",
  "Mobile Accessories",
  "Electricals",
  "Toys & Games",
  "Sports",
  "Jewellery",
  "Handicrafts",
] as const;

export const OTHER_CATEGORY = "Other";

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** True when the category is one of the predefined options. */
export function isPredefinedCategory(value: string | null | undefined): boolean {
  if (!value) return false;
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}
