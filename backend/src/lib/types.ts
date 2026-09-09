export type UserRole = "superadmin" | "admin" | "seller" | "buyer";

export type ShopStatus = "pending" | "approved" | "rejected" | "suspended";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Profile {
  id: string;
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
  shop?: Pick<Shop, "name" | "slug" | "delivery_charge"> | null;
}

export interface ProductWithShop extends Product {
  shop: Pick<Shop, "name" | "slug" | "delivery_charge">;
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
  created_at: string;
  shop?: Pick<Shop, "name" | "slug"> | null;
}

export interface OrderStatusEvent {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
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