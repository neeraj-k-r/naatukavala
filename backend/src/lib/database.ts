/**
 * Minimal generated-style database types for the Naatukavala schema.
 * These mirror `supabase/schema.sql`. After running the migration you can
 * regenerate authoritative types with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.ts
 */

export type UserRole = "superadmin" | "admin" | "seller" | "buyer";
export type ShopStatus = "pending" | "approved" | "rejected" | "suspended";
export type VerificationStatus = "none" | "pending" | "verified" | "rejected";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PromotionStatus = "requested" | "approved" | "rejected" | "expired";

interface Row {
  profiles: {
    id: string;
    email: string | null;
    full_name: string;
    role: UserRole;
    phone: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
  };
  shops: {
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
  };
  products: {
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
    updated_at: string;
  };
  orders: {
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
    feedback_images: string[];
    created_at: string;
  };
  order_items: {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    image_url: string | null;
    quantity: number;
    unit_price: number;
    currency: string;
  };
  order_status_history: {
    id: string;
    order_id: string;
    status: OrderStatus;
    note: string | null;
    created_at: string;
  };
  order_returns: {
    id: string;
    order_id: string;
    buyer_id: string;
    reason: string;
    description: string | null;
    status: ReturnStatus;
    created_at: string;
    decided_at: string | null;
    decision_note: string | null;
  };
  promotions: {
    id: string;
    shop_id: string;
    product_id: string | null;
    status: PromotionStatus;
    note: string | null;
    decision_note: string | null;
    starts_at: string | null;
    ends_at: string | null;
    decided_by: string | null;
    decided_at: string | null;
    created_at: string;
  };
  wishlists: {
    buyer_id: string;
    product_id: string;
    created_at: string;
    price_at_save: number | null;
    notified_price: number | null;
  };
  review_votes: {
    order_id: string;
    voter_id: string;
    created_at: string;
  };
  admin_notifications: {
    id: string;
    kind: string;
    shop_id: string | null;
    order_count: number;
    message: string | null;
    is_read: boolean;
    created_at: string;
    updated_at: string;
  };
}

export type ReturnStatus = "requested" | "approved" | "rejected";

type InsertOf<T extends keyof Row> = Partial<Row[T]> & Record<string, unknown>;
type UpdateOf<T extends keyof Row> = Partial<Row[T]> & Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Row["profiles"];
        Insert: InsertOf<"profiles">;
        Update: UpdateOf<"profiles">;
        Relationships: [];
      };
      shops: {
        Row: Row["shops"];
        Insert: InsertOf<"shops">;
        Update: UpdateOf<"shops">;
        Relationships: [];
      };
      products: {
        Row: Row["products"];
        Insert: InsertOf<"products">;
        Update: UpdateOf<"products">;
        Relationships: [];
      };
      orders: {
        Row: Row["orders"];
        Insert: InsertOf<"orders">;
        Update: UpdateOf<"orders">;
        Relationships: [];
      };
      order_items: {
        Row: Row["order_items"];
        Insert: InsertOf<"order_items">;
        Update: UpdateOf<"order_items">;
        Relationships: [];
      };
      order_status_history: {
        Row: Row["order_status_history"];
        Insert: InsertOf<"order_status_history">;
        Update: UpdateOf<"order_status_history">;
        Relationships: [];
      };
      order_returns: {
        Row: Row["order_returns"];
        Insert: InsertOf<"order_returns">;
        Update: UpdateOf<"order_returns">;
        Relationships: [];
      };
      promotions: {
        Row: Row["promotions"];
        Insert: InsertOf<"promotions">;
        Update: UpdateOf<"promotions">;
        Relationships: [];
      };
      wishlists: {
        Row: Row["wishlists"];
        Insert: InsertOf<"wishlists">;
        Update: UpdateOf<"wishlists">;
        Relationships: [];
      };
      review_votes: {
        Row: Row["review_votes"];
        Insert: InsertOf<"review_votes">;
        Update: UpdateOf<"review_votes">;
        Relationships: [];
      };
      admin_notifications: {
        Row: Row["admin_notifications"];
        Insert: InsertOf<"admin_notifications">;
        Update: UpdateOf<"admin_notifications">;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      shop_status: ShopStatus;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};