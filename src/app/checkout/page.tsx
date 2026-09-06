import Link from "next/link";

import CheckoutForm from "@/components/CheckoutForm";
import { getUser } from "@/lib/auth";

export const metadata = {
  title: "Checkout",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Log in to check out</h1>
        <p className="mt-2 text-sm text-slate-500">
          You need an account to place an order.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return <CheckoutForm />;
}