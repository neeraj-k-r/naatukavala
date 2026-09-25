export type UserRole = "superadmin" | "admin" | "seller" | "buyer";

export type ShopStatus = "pending" | "approved" | "rejected" | "suspended";

export type VerificationStatus = "none" | "pending" | "verified" | "rejected";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: ShopStatus;
  delivery_charge: number;
  return_policy: string | null;
  verification_doc_url: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string | null;
  stock: number;
  images: string[];
  is_active: boolean;
  created_at: string;
  shop?: Pick<Shop, "name" | "slug" | "delivery_charge" | "return_policy" | "verification_status"> | null;
}

export interface ProductWithShop extends Product {
  shop: Pick<Shop, "name" | "slug" | "delivery_charge" | "return_policy" | "verification_status">;
}

export interface Order {
  id: string;
  buyer_id: string;
  shop_id: string;
  status: OrderStatus;
  total: number;
  currency: string;
  shipping_address: string | null;
  buyer_note: string | null;
  tracking_number: string | null;
  rating: number | null;
  feedback: string | null;
  feedback_at: string | null;
  feedback_images?: string[] | null;
  created_at: string;
  shop?: Pick<Shop, "name" | "slug" | "return_policy"> | null;
}

export type ReturnStatus = "requested" | "approved" | "rejected";

export type PromotionStatus = "requested" | "approved" | "rejected" | "expired";

export interface Promotion {
  id: string;
  shop_id: string;
  product_id: string | null;
  status: PromotionStatus;
  note: string | null;
  decision_note: string | null;
  starts_at: string | null;
  ends_at: string | null;
  decided_at: string | null;
  created_at: string;
  shop_name?: string | null;
  shop_slug?: string | null;
  product_name?: string | null;
}

export interface Spotlight {
  products: ProductWithShop[];
  shops: Shop[];
}

export interface WishlistItem {
  product_id: string;
  created_at: string;
  price_at_save: number | null;
  notified_price: number | null;
  product: ProductWithShop;
}

export interface PriceDrop {
  product_id: string;
  old_price: number;
  new_price: number;
  percent_off: number;
  product: ProductWithShop;
}

export interface OrderReturn {
  id: string;
  order_id: string;
  buyer_id: string;
  reason: string;
  description: string | null;
  status: ReturnStatus;
  created_at: string;
  decided_at: string | null;
  decision_note: string | null;
}

export const DEFAULT_RETURN_REASONS = [
  "Item is damaged or defective",
  "Received the wrong item",
  "Item not as described",
  "Missing item or accessories",
  "Product quality not good",
  "Other",
] as const;

export interface OrderStatusEvent {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface Review {
  order_id: string;
  rating: number;
  feedback: string | null;
  images: string[];
  helpful_count: number;
  created_at: string;
  buyer_name: string | null;
}

export interface RatingSummary {
  average: number | null;
  count: number;
  distribution: { stars: number; count: number }[];
  reviews: Review[];
}

export interface SellerStatsSummary {
  orders: number;
  revenue: number;
  avgOrderValue: number;
  delivered: number;
  pending: number;
  confirmed: number;
  shipped: number;
  cancelled: number;
}

export interface SellerProductStat {
  product_id: string;
  product_name: string;
  image_url: string | null;
  currency: string;
  units: number;
  revenue: number;
}

export interface SellerMonthlyStat {
  month: string;
  orders: number;
  revenue: number;
}

export interface SellerStats {
  summary: SellerStatsSummary;
  monthly: SellerMonthlyStat[];
  products: SellerProductStat[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
}

export interface CartLine {
  product_id: string;
  quantity: number;
}

export interface AdminSalesSummary {
  totalOrders: number;
  netOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
  last7Revenue: number;
  last30Revenue: number;
  delivered: number;
  pending: number;
  confirmed: number;
  shipped: number;
  cancelled: number;
  upcoming: number;
  inTransit: number;
  needsTracking: number;
  pendingReturns: number;
}

export interface AdminDailyStat {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

export interface AdminStatusBreakdown {
  status: string;
  orders: number;
  revenue: number;
}

export interface AdminTopShop {
  shop_id: string;
  shop_name: string;
  shop_slug: string | null;
  orders: number;
  revenue: number;
}

export interface AdminPendingReturn {
  id: string;
  order_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface AdminSalesReport {
  summary: AdminSalesSummary;
  daily: AdminDailyStat[];
  monthly: SellerMonthlyStat[];
  byStatus: AdminStatusBreakdown[];
  topShops: AdminTopShop[];
  topProducts: SellerProductStat[];
  pendingReturns: AdminPendingReturn[];
  currency: string;
}

export interface AdminBooking {
  id: string;
  buyer_id: string;
  buyer_name: string | null;
  shop_id: string;
  status: OrderStatus;
  total: number;
  currency: string;
  shipping_address: string | null;
  buyer_note: string | null;
  tracking_number: string | null;
  created_at: string;
  shop: { name: string; slug: string } | null;
}