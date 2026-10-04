/** Shared loading skeletons for admin pages. */
export function AdminTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-5 py-3 text-left">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="px-5 py-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminCardListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-1 h-3 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminProductCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-72 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminBookingCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-7 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            <div className="h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="h-10 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminPageHeaderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-1 h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

export function AdminTabsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
      ))}
    </div>
  );
}

export function AdminSearchSkeleton() {
  return (
    <form className="flex gap-2 animate-pulse">
      <div className="min-w-0 flex-1 h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
    </form>
  );
}