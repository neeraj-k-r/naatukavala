import Link from "next/link";

export const metadata = {
  title: "Sell with Naatukavala — get your own shop",
};

const features = [
  {
    icon: "🏪",
    title: "Your own shop page",
    text: "A personal storefront on your brand's own subdomain, ready for customers.",
  },
  {
    icon: "📦",
    title: "List products in minutes",
    text: "Add product photos and prices. Cloudinary-hosted images keep shops fast.",
  },
  {
    icon: "🛒",
    title: "Sell to everyone",
    text: "Your products appear in the central marketplace for every buyer to discover.",
  },
  {
    icon: "✅",
    title: "Simple approval",
    text: "After you register with your brand name, our team approves your shop to go live.",
  },
];

export default function SellPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Open your shop on Naatukavala
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          If you run a local shop or sell things online, you get a storefront
          on your own subdomain — and every one of your products is listed in
          the Naatukavala marketplace.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/signup?role=seller"
            className="rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Start selling
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Log in
          </Link>
        </div>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="text-3xl">{feature.icon}</div>
            <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">
              {feature.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{feature.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-3xl bg-emerald-600 px-6 py-10 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to get your own shop?</h2>
        <p className="mt-2 text-emerald-50">
          Register with your brand name and we&apos;ll approve your shop quickly.
        </p>
        <Link
          href="/signup?role=seller"
          className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Create a shop account
        </Link>
      </div>
    </div>
  );
}