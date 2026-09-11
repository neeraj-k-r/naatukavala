export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
      <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />
      ))}
    </div>
  );
}