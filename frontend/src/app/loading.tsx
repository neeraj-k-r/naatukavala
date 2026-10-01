import Image from "next/image";

export default function MarketplaceLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Naatukavala"
      className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f6f1de] px-4 py-16 dark:bg-slate-950"
    >
      <Image
        src="/naatukavala.png"
        alt="Naatukavala"
        width={220}
        height={220}
        className="h-44 w-44 rounded-full object-cover shadow-lg ring-4 ring-emerald-900/15"
        priority
      />
      <div className="mt-8 flex items-center gap-2.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{ animation: `naatukavala-dot 1.2s ease-in-out ${i * 0.15}s infinite` }}
            className={
              i === 0
                ? "h-3.5 w-3.5 rounded-full bg-emerald-950 dark:bg-emerald-400"
                : "h-3.5 w-3.5 rounded-full bg-emerald-950/40 dark:bg-slate-600"
            }
          />
        ))}
      </div>
      <p className="mt-4 text-xl font-medium tracking-[0.2em] text-emerald-950 dark:text-emerald-200">
        Loading...
      </p>
    </div>
  );
}
