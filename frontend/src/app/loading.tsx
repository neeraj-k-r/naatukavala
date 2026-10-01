import Image from "next/image";

export default function MarketplaceLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f6f1de] px-4 py-16 dark:bg-slate-950">
      <Image
        src="/naatukavala.png"
        alt="Naatukavala"
        width={220}
        height={220}
        className="h-44 w-44 rounded-full object-cover shadow-lg ring-4 ring-emerald-900/15"
        priority
      />
      <p className="mt-6 text-xl font-medium tracking-[0.2em] text-emerald-950 dark:text-emerald-200">
        Loading...
      </p>
    </div>
  );
}
