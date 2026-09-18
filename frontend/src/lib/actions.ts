"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

import type {
  CartLine,
  OrderStatus,
  UserRole,
} from "@/lib/types";

function requireValues(formData: FormData, keys: string[]): string[] {
  const values = keys.map((key) => String(formData.get(key) ?? "").trim());
  if (values.some((value) => value.length === 0)) {
    throw new Error("Please fill in all required fields.");
  }
  return values;
}

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

// ---------------------------------------------------------------- Auth

const roleAllowed = (role: string): role is UserRole =>
  role === "buyer" || role === "seller";

// Keep client-side checks aligned with Supabase/bcrypt limits and reject
// over-long input before it ever reaches the database.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 72;
const MAX_NAME_LENGTH = 100;
const MAX_TAGLINE_LENGTH = 160;

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
  if (!EMAIL_RE.test(email) || email.length > MAX_EMAIL_LENGTH) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: "Password must be under 72 characters." };
  }
  if (fullName.length > MAX_NAME_LENGTH) {
    return { error: "Name must be under 100 characters." };
  }
  if (brandName.length > MAX_NAME_LENGTH) {
    return { error: "Brand name must be under 100 characters." };
  }
  if (tagline.length > MAX_TAGLINE_LENGTH) {
    return { error: "Tagline must be under 160 characters." };
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
  if (role === "seller" && session) {
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

  if (session) {
    revalidatePath("/", "layout");
    redirect(role === "seller" ? "/dashboard" : "/");
  }
  revalidatePath("/", "layout");
  redirect("/auth/verify");
}

export async function signIn(state: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email) || email.length > MAX_EMAIL_LENGTH) {
    return { error: "Invalid email or password, or the account was not confirmed yet." };
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Never log the email address — auth logs should not contain PII.
    console.error("[signIn] auth error", {
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
  revalidatePath("/", "layout");
  redirect(user?.role === "seller" ? "/dashboard" : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ---------------------------------------------------------------- Promotions

/** Sellers request a sponsored spot for their shop or one product. */
export async function requestPromotion(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const target = String(formData.get("target") ?? "shop");
  const note = String(formData.get("note") ?? "").trim();

  if (note.length > 300) {
    return { error: "Note must be under 300 characters." };
  }

  try {
    await fetchApi("/promotions", {
      method: "POST",
      body: JSON.stringify({
        product_id: target === "shop" ? null : target,
        note: note || null,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not request the promotion.") };
  }

  revalidatePath("/dashboard/promotion");
  return { success: true };
}

/** Admins approve (time-boxed), reject, or expire a promotion. */
export async function decidePromotion(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.profile || !["superadmin", "admin"].includes(user.profile.role)) {
    redirect("/");
  }

  const promotionId = String(formData.get("promotion_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const durationDays = Number(formData.get("duration_days") ?? 30);
  const decisionNote = String(formData.get("decision_note") ?? "").trim();

  if (!promotionId || !["approve", "reject", "expire"].includes(decision)) {
    return { error: "Invalid decision." };
  }

  try {
    await fetchApi(`/promotions/${promotionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        decision,
        duration_days: durationDays,
        decision_note: decisionNote || null,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not update the promotion.") };
  }

  revalidatePath("/admin/promotions");
  revalidatePath("/");
  return { success: true };
}

// ---------------------------------------------------------------- Wishlist

/** Toggles a product in the signed-in user's wishlist. */
export async function toggleWishlist(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const productId = String(formData.get("product_id") ?? "");
  if (!productId) return { error: "Product is required." };

  let wished = false;
  try {
    const data = await fetchApi<{ wished: boolean }>("/wishlist", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    });
    wished = data.wished ?? false;
  } catch (err) {
    return { error: messageOf(err, "Could not update your wishlist.") };
  }

  revalidatePath("/wishlist");
  return { success: true, wished };
}

// ---------------------------------------------------------------- Seller

/** Creates the seller's shop after signup/onboarding. */
export async function createShop(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const [name, slugInput] = requireValues(formData, ["name", "slug"]);
  const tagline = String(formData.get("tagline") ?? "").trim();
  const deliveryCharge = Number(formData.get("delivery_charge") ?? 0);

  const slug = slugify(slugInput);
  if (!slug) return { error: "Invalid shop URL." };

  if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0) {
    return { error: "Please enter a valid delivery charge." };
  }

  try {
    await fetchApi("/shops", {
      method: "POST",
      body: JSON.stringify({
        name,
        slug,
        tagline: tagline || null,
        delivery_charge: deliveryCharge,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not create your shop. Please try again.") };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateShop(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const shopId = String(formData.get("shop_id") ?? "");

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const deliveryCharge = Number(formData.get("delivery_charge") ?? 0);
  const returnPolicy = String(formData.get("return_policy") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const bannerUrl = String(formData.get("banner_url") ?? "").trim();

  if (!Number.isFinite(deliveryCharge) || deliveryCharge < 0) {
    return { error: "Please enter a valid delivery charge." };
  }
  if (returnPolicy.length > 500) {
    return { error: "Return policy must be under 500 characters." };
  }

  if (!shopId) return { error: "Shop not found." };

  try {
    await fetchApi(`/shops/${shopId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: name || undefined,
        tagline: tagline || null,
        description: description || null,
        delivery_charge: deliveryCharge,
        return_policy: returnPolicy || null,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not update your shop.") };
  }

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

  try {
    await fetchApi("/products", {
      method: "POST",
      body: JSON.stringify({
        name,
        price,
        stock,
        category: category || null,
        description: description || null,
        images,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not create the product.") };
  }

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

  try {
    await fetchApi(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        price,
        stock,
        category: category || null,
        description: description || null,
        is_active: isActive,
        images,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not update the product.") };
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const id = String(formData.get("id") ?? "");

  try {
    await fetchApi(`/products/${id}`, { method: "DELETE" });
  } catch (err) {
    return { error: messageOf(err, "Could not delete the product.") };
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/");
  return { success: true };
}

export async function updateOrderStatus(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const trackingNumber = String(formData.get("tracking_number") ?? "").trim();

  if (!orderId || !["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(status)) {
    return { error: "Invalid status." };
  }

  try {
    await fetchApi(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        tracking_number: trackingNumber || undefined,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not update the order.") };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/account");
  return { success: true };
}

export async function addTrackingNumber(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const orderId = String(formData.get("order_id") ?? "");
  const trackingNumber = String(formData.get("tracking_number") ?? "").trim();

  if (!orderId) return { error: "Missing order." };

  try {
    await fetchApi(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: String(formData.get("status") ?? ""),
        tracking_number: trackingNumber || undefined,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not save the tracking number.") };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/account");
  return { success: true };
}

export async function submitFeedback(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const orderId = String(formData.get("order_id") ?? "");
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!orderId) return { error: "Missing order." };

  const rating = ratingRaw === "" ? null : Math.round(Number(ratingRaw));
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return { error: "Rating must be between 1 and 5 stars." };
  }
  if (!rating && !feedback) return { error: "Add a rating, a comment, or both." };

  try {
    await fetchApi(`/orders/${orderId}/feedback`, {
      method: "PATCH",
      body: JSON.stringify({
        rating,
        feedback: feedback || null,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not save your feedback.") };
  }

  revalidatePath("/account");
  revalidatePath("/dashboard/orders");
  return { success: true };
}

export async function requestReturn(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const orderId = String(formData.get("order_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!orderId) return { error: "Missing order." };
  if (!reason) return { error: "Please choose a reason for the return." };
  if (/other/i.test(reason) && !description) {
    return { error: "Please describe the issue in a few words." };
  }

  try {
    await fetchApi(`/orders/${orderId}/return`, {
      method: "POST",
      body: JSON.stringify({ reason, description: description || null }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not request a return.") };
  }

  revalidatePath("/account");
  revalidatePath("/dashboard/orders");
  return { success: true };
}

export async function decideReturn(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.profile || user.profile.role !== "seller") redirect("/login");

  const orderId = String(formData.get("order_id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!orderId || !["approved", "rejected"].includes(decision)) {
    return { error: "Invalid decision." };
  }

  try {
    await fetchApi(`/orders/${orderId}/return`, {
      method: "PATCH",
      body: JSON.stringify({ decision }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not update the return request.") };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/account");
  return { success: true };
}

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

  try {
    await fetchApi("/orders", {
      method: "POST",
      body: JSON.stringify({
        cart,
        shipping_address: shippingAddress || null,
        buyer_note: buyerNote || null,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not place your order. Please try again.") };
  }

  revalidatePath("/account");
  revalidatePath("/dashboard/orders");
  redirect("/account?placed=1");
}

// ---------------------------------------------------------------- Admin

export async function approveShop(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.profile || !["superadmin", "admin"].includes(user.profile.role)) {
    redirect("/");
  }

  const shopId = String(formData.get("shop_id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approve" | "reject" | "suspend";

  if (!["approve", "reject", "suspend"].includes(decision)) {
    return { error: "Invalid decision." };
  }

  try {
    await fetchApi(`/admin/shops/${shopId}`, {
      method: "PATCH",
      body: JSON.stringify({ decision }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not update the shop.") };
  }

  revalidatePath("/admin/shops");
  revalidatePath("/");
  return { success: true };
}

export async function decideVerification(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.profile || !["superadmin", "admin"].includes(user.profile.role)) {
    redirect("/");
  }

  const shopId = String(formData.get("shop_id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!shopId || !["verified", "rejected"].includes(decision)) {
    return { error: "Invalid decision." };
  }

  try {
    await fetchApi(`/admin/shops/${shopId}/verification`, {
      method: "PATCH",
      body: JSON.stringify({ decision }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not update verification.") };
  }

  revalidatePath("/admin/shops");
  revalidatePath("/");
  return { success: true };
}

export async function submitVerification(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "seller") redirect("/login");

  const shopId = String(formData.get("shop_id") ?? "");
  const docUrl = String(formData.get("doc_url") ?? "").trim();

  if (!shopId) return { error: "Shop not found." };
  if (!docUrl) return { error: "Please upload your identity document first." };

  try {
    await fetchApi(`/shops/${shopId}/verification`, {
      method: "POST",
      body: JSON.stringify({ doc_url: docUrl }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not submit verification.") };
  }

  revalidatePath("/dashboard/shop");
  return { success: true };
}

export async function updateUserRole(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.profile || !["superadmin", "admin"].includes(user.profile.role)) {
    redirect("/");
  }

  const targetId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!["superadmin", "admin", "seller", "buyer"].includes(role)) {
    return { error: "Invalid role." };
  }

  try {
    await fetchApi(`/admin/users/${targetId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not update the user role.") };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateAdminBooking(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.profile || !["superadmin", "admin"].includes(user.profile.role)) {
    redirect("/");
  }

  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const trackingNumber = String(formData.get("tracking_number") ?? "").trim();

  if (!orderId || !["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(status)) {
    return { error: "Invalid status." };
  }

  try {
    await fetchApi(`/admin/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        tracking_number: trackingNumber || undefined,
      }),
    });
  } catch (err) {
    return { error: messageOf(err, "Could not update the booking.") };
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteUser(state: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.profile || !["superadmin", "admin"].includes(user.profile.role)) {
    redirect("/");
  }

  const targetId = String(formData.get("user_id") ?? "");
  if (targetId === user.id) return { error: "You cannot delete yourself." };

  try {
    await fetchApi(`/admin/users/${targetId}`, { method: "DELETE" });
  } catch (err) {
    return { error: messageOf(err, "Could not delete the user.") };
  }

  revalidatePath("/admin/users");
  return { success: true };
}