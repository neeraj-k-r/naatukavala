"use client";

import { useActionState, useState } from "react";

import { createShop, updateShop } from "@/lib/actions";
import ShopImageUpload from "@/components/ShopImageUpload";
import SubmitButton from "@/components/SubmitButton";
import { slugify } from "@/lib/utils";

import type { Shop } from "@/lib/types";

const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "naatukavala.com";

export default function ShopForm({ shop }: { shop: Shop | null }) {
  const action = shop ? updateShop : createShop;
  const [state, formAction] = useActionState(action, undefined);
  const [name, setName] = useState(shop?.name ?? "");
  const [slugDraft, setSlugDraft] = useState(shop?.slug ?? "");
  const slug = slugify(slugDraft || name);

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
    >
      {shop && <input type="hidden" name="shop_id" value={shop.id} />}

      {state && "error" in state && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {String((state as { error: string }).error)}
        </div>
      )}
      {state && "success" in state && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Saved.
        </div>
      )}

      <div>
        <label
          htmlFor="shop_name"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Shop name
        </label>
        <input
          id="shop_name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={Boolean(shop)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
        />
      </div>

      {!shop && (
        <div>
          <label
            htmlFor="shop_slug"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Shop URL
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
            <input
              id="shop_slug"
              name="slug"
              type="text"
              required
              value={slug}
              onChange={(event) => setSlugDraft(event.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none"
            />
            <span className="text-sm text-slate-400">.{appDomain}</span>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="shop_tagline"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Tagline
        </label>
        <input
          id="shop_tagline"
          name="tagline"
          type="text"
          defaultValue={shop?.tagline ?? ""}
          placeholder="e.g. School & office stationery specialists"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {shop && (
        <div>
          <label
            htmlFor="shop_description"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            About the shop
          </label>
          <textarea
            id="shop_description"
            name="description"
            rows={4}
            defaultValue={shop.description ?? ""}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="shop_delivery_charge"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Delivery charge
        </label>
        <div className="flex items-center rounded-xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
          <span className="pl-4 text-sm text-slate-400">₹</span>
          <input
            id="shop_delivery_charge"
            name="delivery_charge"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={shop?.delivery_charge ?? 0}
            className="w-full rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Added once per order from your shop. Set 0 for free delivery.
        </p>
      </div>

      <div>
        <label
          htmlFor="shop_return_policy"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Return policy
        </label>
        <input
          id="shop_return_policy"
          name="return_policy"
          type="text"
          defaultValue={shop?.return_policy ?? ""}
          placeholder="e.g. 7 days replacement on damaged or defective items"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <p className="mt-1 text-xs text-slate-400">
          Buyers can request a return for delivered orders. Leave empty for no
          returns.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ShopImageUpload
          name="logo_url"
          label="Shop logo"
          initialUrl={shop?.logo_url ?? ""}
          hint="Square image. Shows next to your shop name."
          aspectClass="aspect-square"
        />
        <ShopImageUpload
          name="banner_url"
          label="Shop banner"
          initialUrl={shop?.banner_url ?? ""}
          hint="Wide image. Shows at the top of your storefront."
          aspectClass="aspect-video"
        />
      </div>

      <SubmitButton
        pendingText="Saving…"
        className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {shop ? "Save changes" : "Create shop"}
      </SubmitButton>
    </form>
  );
}