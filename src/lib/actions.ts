"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

import type {
  CartLine,
  OrderStatus,
  ShopStatus,
  UserRole,
} from "@/lib/types";

function requireValues(formData: FormData, keys: string[]): string[] {
  const values = keys.map((key) => String(formData.get(key) ?? "").trim());
  if (values.some((value) => value.length === 0)) {
    throw new Error("Please fill in all required fields.");
  }
  return values;
}

// ---------------------------------------------------------------- Auth

const roleAllowed = (role: string): role is UserRole =>
  role === "buyer" || role === "seller";

export async function signUp(state: unknown, formData: FormData) {
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "buyer");
  const brandName = String(formData.get("brand_name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const bannerUrl = String(formData.get("banner_url") ?? "").trim();

  if (!fullName || !email || !password) {
    return { error: "Name, email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }
  if (!roleAllowed(role)) {
    return { error: "Invalid account type." };
  }
  if (role === "seller" && !brandName) {
    return { error: "Brand name is required for sellers." };
  }

  const {
    data: { user, session },
    error: signUpError,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
      },
    },
  });

  if (signUpError || !user) {
    return { error: signUpError?.message ?? "Signup failed. Please try again." };
  }

  // Create the profile (idempotent: the trigger may already have created it).
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      role,
    },
    { onConflict: "id" },
  );

  // If email confirmation is enabled there is no active session yet — the
  // seller completes their shop after confirming + first login.
  if (role === "seller") {
    if (session) {
      const slug = slugify(formData.get("slug")?.toString() || brandName);
      const { error: shopError } = await supabase.from("shops").insert({
        owner_id: user.id,
        name: brandName,
        slug,
        tagline: tagline || null,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        status: "pending",
      });
      if (shopError) {
        return { error: shopError.message };
      }
    }
  }

  if (session) {
    redirect(role === "seller" ? "/dashboard" : "/");
  }
  redirect("/auth/verify");
}

export async function signIn(state: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[signIn] auth error", {
      email,
      code: error.code ?? null,
      status: error.status ?? null,
      message: error.message,
      hasSession: Boolean(signInData.session),
    });
    if (process.env.NODE_ENV === "development") {
      return {
        error: `Login failed (${error.code ?? error.status ?? "unknown"}): ${error.message}`,
      };
    }
    return { error: "Invalid email or password, or the account was not confirmed yet." };
  }

  const user = await getUser();
  redirect(user?.role === "seller" ? "/dashboard" : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------- Seller

/** Creates the seller's shop after signup/onboarding. */
export async function createShop(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const supabase = await createClient();
  const [name, slugInput] = requireValues(formData, ["name", "slug"]);
  const tagline = String(formData.get("tagline") ?? "").trim();
  const deliveryCharge = Number(formData.get("delivery_charge") ?? 0);
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const bannerUrl = String(formData.get("banner_url") ?? "").trim();

  if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0) {
    return { error: "Please enter a valid delivery charge." };
  }

  const slug = slugify(slugInput);
  if (!slug) return { error: "Invalid shop URL." };

  const { error } = await supabase.from("shops").insert({
    owner_id: user.id,
    name,
    slug,
    tagline: tagline || null,
    logo_url: logoUrl || null,
    banner_url: bannerUrl || null,
    delivery_charge: deliveryCharge,
    status: "pending",
  });

  if (error) {
    // slug conflict
    return { error: "That shop URL is already taken. Try a different one." };
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateShop(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const supabase = await createClient();
  const shopId = String(formData.get("shop_id") ?? "");

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const deliveryCharge = Number(formData.get("delivery_charge") ?? 0);
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const bannerUrl = String(formData.get("banner_url") ?? "").trim();

  if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0) {
    return { error: "Please enter a valid delivery charge." };
  }

  const { error } = await supabase
    .from("shops")
    .update({
      name: name || undefined,
      tagline: tagline || null,
      description: description || null,
      delivery_charge: deliveryCharge,
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
    })
    .eq("id", shopId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/shop");
  return { success: true };
}

export async function createProduct(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const [name] = requireValues(formData, ["name"]);
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock") ?? 0);
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const images = formData.getAll("images").map((image) => String(image));

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Please enter a valid price." };
  }

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) {
    return { error: "Please create your shop before adding products." };
  }

  const { error } = await supabase.from("products").insert({
    shop_id: shop.id,
    name,
    price,
    stock,
    category: category || null,
    description: description || null,
    images,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/products");
  revalidatePath("/");
  return { success: true };
}

export async function updateProduct(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock") ?? 0);
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isActive = formData.get("is_active") === "true";
  const images = formData.getAll("images").map((image) => String(image));

  if (!name) {
    return { error: "Product name is required." };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Please enter a valid price." };
  }

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) return { error: "Shop not found." };

  const { error } = await supabase
    .from("products")
    .update({
      name,
      price,
      stock,
      category: category || null,
      description: description || null,
      is_active: isActive,
      images,
    })
    .eq("id", id)
    .eq("shop_id", shop.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/products");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) return { error: "Shop not found." };

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("shop_id", shop.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/products");
  revalidatePath("/");
  return { success: true };
}

export async function updateOrderStatus(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;

  if (!orderId || !["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(status)) {
    return { error: "Invalid status." };
  }

  const supabase = await createClient();
  // RLS ensures this only touches orders for the seller's own shops.
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("shop_id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/orders");
  revalidatePath("/account");
  return { success: true };
}

// ---------------------------------------------------------------- Buyer

export async function placeOrder(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const shippingAddress = String(formData.get("shipping_address") ?? "").trim();
  const buyerNote = String(formData.get("buyer_note") ?? "").trim();
  const cartRaw = String(formData.get("cart") ?? "[]");

  let cart: CartLine[];
  try {
    cart = JSON.parse(cartRaw);
  } catch {
    return { error: "Your cart is invalid. Please try again." };
  }

  if (cart.length === 0) return { error: "Your cart is empty." };

  const supabase = await createClient();
  const ids = cart.map((line) => line.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", ids);

  if (productsError || !products || products.length !== ids.length) {
    return { error: "Some products in your cart are no longer available." };
  }

  // Group lines by shop so each shop gets its own order.
  const byShop = new Map<string, { product: (typeof products)[0]; quantity: number }[]>();
  for (const line of cart) {
    const product = products.find((p) => p.id === line.product_id);
    if (!product) continue;
    const qty = Math.max(1, Math.floor(line.quantity));
    if (product.stock < qty) {
      return { error: `"${product.name}" only has ${product.stock} in stock.` };
    }
    const list = byShop.get(product.shop_id) ?? [];
    list.push({ product, quantity: qty });
    byShop.set(product.shop_id, list);
  }

  for (const [shopId, lines] of byShop) {
    const productsTotal = lines.reduce(
      (sum, { product, quantity }) => sum + product.price * quantity,
      0,
    );

    // Delivery charge is read from the shop row (authoritative, not client-supplied).
    const { data: shopRow } = await supabase
      .from("shops")
      .select("delivery_charge")
      .eq("id", shopId)
      .maybeSingle();
    const deliveryCharge = shopRow?.delivery_charge ?? 0;

    const total = productsTotal + Number(deliveryCharge);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        shop_id: shopId,
        total,
        shipping_address: shippingAddress || null,
        buyer_note: buyerNote || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      return { error: "Could not place your order. Please try again." };
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map(({ product, quantity }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        image_url: product.images?.[0] ?? null,
        quantity,
        unit_price: product.price,
        currency: product.currency ?? "INR",
      })),
    );

    if (itemsError) {
      return { error: "Could not save your order items. Please try again." };
    }
  }

  revalidatePath("/account");
  revalidatePath("/dashboard/orders");
  redirect("/account?placed=1");
}

// ---------------------------------------------------------------- Admin

async function isStaff(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "superadmin" || data?.role === "admin";
}

export async function approveShop(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await isStaff(user.id))) redirect("/");

  const shopId = String(formData.get("shop_id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approve" | "reject" | "suspend";

  const statusFor: Record<string, ShopStatus> = {
    approve: "approved",
    reject: "rejected",
    suspend: "suspended",
  };
  if (!statusFor[decision]) return { error: "Invalid decision." };

  const admin = getAdminClient();
  const { error } = await admin
    .from("shops")
    .update({
      status: statusFor[decision],
      approved_by: user.id,
      approved_at: decision === "approve" ? new Date().toISOString() : null,
    })
    .eq("id", shopId);

  if (error) return { error: error.message };
  revalidatePath("/admin/shops");
  revalidatePath("/");
  return { success: true };
}

export async function updateUserRole(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await isStaff(user.id))) redirect("/");

  const targetId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!["superadmin", "admin", "seller", "buyer"].includes(role)) {
    return { error: "Invalid role." };
  }
  // Only a superadmin may make someone an admin or superadmin.
  const supabase = await createClient();
  const { data: actingProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((role === "admin" || role === "superadmin") && actingProfile?.role !== "superadmin") {
    return { error: "Only the superadmin can assign admin roles." };
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", targetId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await isStaff(user.id))) redirect("/");

  const targetId = String(formData.get("user_id") ?? "");
  if (targetId === user.id) return { error: "You cannot delete yourself." };

  const admin = getAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}