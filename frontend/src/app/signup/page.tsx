"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState } from "react";

import { signUp } from "@/lib/actions";
import ShopImageUpload from "@/components/ShopImageUpload";
import SubmitButton from "@/components/SubmitButton";
import { slugify } from "@/lib/utils";

const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "naatukavala.com";

function SignupForm() {
  const [state, action] = useActionState(signUp, undefined);
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"buyer" | "seller">(
    searchParams.get("role") === "seller" ? "seller" : "buyer",
  );
  const [brandName, setBrandName] = useState("");

  const slugPreview = slugify(brandName) || "your-shop";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Join Naatukavala as a buyer or a shop-owner.
        </p>

        {/* Role selector */}
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRole("buyer")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              role === "buyer"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500"
            }`}
          >
            I&apos;m a buyer
          </button>
          <button
            type="button"
            onClick={() => setRole("seller")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              role === "seller"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500"
            }`}
          >
            I&apos;m a shop-owner
          </button>
        </div>

        <form action={action} className="mt-5 space-y-4">
          <input type="hidden" name="role" value={role} />

          {state?.error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="full_name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {role === "seller" && (
            <>
              <div>
                <label
                  htmlFor="brand_name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Brand / shop name
                </label>
                <input
                  id="brand_name"
                  name="brand_name"
                  type="text"
                  required
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  placeholder="e.g. Handy Mart Stationery"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Shop URL (subdomain)
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    defaultValue={slugPreview}
                    className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none"
                  />
                  <span className="text-sm text-slate-400">.{appDomain}</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="tagline"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Tagline <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  id="tagline"
                  name="tagline"
                  type="text"
                  placeholder="e.g. School & office stationery specialists"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <details className="group rounded-xl border border-slate-100 bg-white px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-slate-700 marker:content-none">
                  Add shop images{" "}
                  <span className="text-slate-400">(optional)</span>
                  <span className="ml-1 text-slate-400 transition-transform group-open:rotate-90">
                    ›
                  </span>
                </summary>
                <div className="mt-4 space-y-4">
                  <ShopImageUpload
                    name="logo_url"
                    label="Shop logo"
                    hint="Square image. Shows next to your shop name."
                    aspectClass="aspect-square"
                  />
                  <ShopImageUpload
                    name="banner_url"
                    label="Shop banner"
                    hint="Wide image. Shows at the top of your storefront."
                    aspectClass="aspect-video"
                  />
                </div>
              </details>
            </>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              At least 8 characters.
            </p>
          </div>

          <SubmitButton
            pendingText="Creating account…"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {role === "seller" ? "Create shop account" : "Sign up"}
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
            Log in
          </Link>
        </p>

        {role === "seller" && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Shop accounts need approval by our team before they go live. You
            can still add products while we review your shop.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <SignupForm />
    </Suspense>
  );
}