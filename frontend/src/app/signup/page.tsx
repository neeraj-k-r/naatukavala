"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState } from "react";

import { signUp } from "@/lib/actions";
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
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Join Naatukavala as a buyer or a shop-owner.
        </p>

        {/* Role selector */}
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setRole("buyer")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              role === "buyer"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            I&apos;m a buyer
          </button>
          <button
            type="button"
            onClick={() => setRole("seller")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              role === "seller"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            I&apos;m a shop-owner
          </button>
        </div>

        <form action={action} className="mt-5 space-y-4">
          <input type="hidden" name="role" value={role} />

          {state?.error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="full_name"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          {role === "seller" && (
            <>
              <div>
                <label
                  htmlFor="brand_name"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Shop URL (subdomain)
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    defaultValue={slugPreview}
                    className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
                  />
                  <span className="text-sm text-slate-400 dark:text-slate-500">.{appDomain}</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="tagline"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Tagline <span className="text-slate-400 dark:text-slate-500">(optional)</span>
                </label>
                <input
                  id="tagline"
                  name="tagline"
                  type="text"
                  placeholder="e.g. School & office stationery specialists"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  You can add your shop logo and banner after signing up,
                  from your dashboard shop profile.
                </p>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
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

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            Log in
          </Link>
        </p>

        {role === "seller" && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
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