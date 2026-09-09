/**
 * Minimal generated-style database types for the Naatukavala schema.
 * These mirror `supabase/schema.sql`. After running the migration you can
 * regenerate authoritative types with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.ts
 */

export type UserRole = "superadmin" | "admin" | "seller" | "buyer";
export type ShopStatus = "pending" | "approved" | "rejected" | "suspended";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

interface Row {
  profiles: {
    id: string;
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