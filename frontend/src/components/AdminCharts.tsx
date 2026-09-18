import { formatCurrency } from "@/lib/utils";
import type { AdminDailyStat, SellerMonthlyStat } from "@/lib/types";

const monthLabel = (month: string) => {
  const [year, index] = month.split("-");
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${labels[Number(index) - 1] ?? ""} ${year.slice(2)}`;
};

/** SVG area + line graph of daily revenue with order-count dots. */
export function RevenueAreaChart({
  daily,
  currency,
}: {
  daily: AdminDailyStat[];
  currency: string;
}) {
  if (daily.length === 0 || daily.every((d) => d.revenue === 0 && d.orders === 0)) {
    return <p className="mt-2 text-sm text-slate-500">No sales in this period yet.</p>;
  }
  const W = 720;
  const H = 220;
  const PAD = 28;
  const maxRevenue = Math.max(...daily.map((d) => d.revenue), 1);
  const stepX = daily.length > 1 ? (W - PAD * 2) / (daily.length - 1) : 0;
  const x = (i: number) => PAD + i * stepX;
  const y = (v: number) => H - PAD - (v / maxRevenue) * (H - PAD * 2);

  const line = daily.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join(" ");
  const area = `${line} L${x(daily.length - 1).toFixed(1)},${(H - PAD).toFixed(1)} L${x(0).toFixed(1)},${(H - PAD).toFixed(1)} Z`;
  const ticks = [0, 0.5, 1].map((t) => ({ value: maxRevenue * t, y: y(maxRevenue * t) }));
  const labelEvery = Math.max(1, Math.ceil(daily.length / 8));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="Daily revenue graph">
        <defs>
          <linearGradient id="admin-revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line x1={PAD} x2={W - 8} y1={tick.y} y2={tick.y} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={2} y={tick.y + 3} fontSize="9" fill="#94a3b8">
              {tick.value >= 1000 ? `${Math.round(tick.value / 1000)}k` : Math.round(tick.value)}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#admin-revenue-fill)" />
        <path d={line} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {daily.map((d, i) => (
          <g key={d.date}>
            <circle cx={x(i)} cy={y(d.revenue)} r={i % labelEvery === 0 ? 3.5 : 2} fill="#059669" stroke="#fff" strokeWidth="1.5">
              <title>{`${d.label}: ${formatCurrency(d.revenue, currency)} · ${d.orders} orders`}</title>
            </circle>
            {i % labelEvery === 0 && (
              <text x={x(i)} y={H - 8} fontSize="9" fill="#64748b" textAnchor="middle">
                {d.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>Peak day: {formatCurrency(maxRevenue, currency)}</span>
        <span>{daily.reduce((sum, d) => sum + d.orders, 0)} orders in period</span>
      </div>
    </div>
  );
}

/** Monthly revenue bars for the last 6 months. */
export function MonthlyBarChart({
  monthly,
  currency,
}: {
  monthly: SellerMonthlyStat[];
  currency: string;
}) {
  const max = Math.max(...monthly.map((m) => m.revenue), 1);
  return (
    <div className="mt-5 flex h-44 items-end gap-3">
      {monthly.map((m) => {
        const height = Math.max((m.revenue / max) * 100, m.revenue > 0 ? 6 : 2);
        return (
          <div key={m.month} className="flex flex-1 flex-col items-center gap-2" title={`${m.orders} orders · ${formatCurrency(m.revenue, currency)}`}>
            <span className="text-[11px] font-bold text-slate-700">
              {m.revenue > 0 ? formatCurrency(m.revenue, currency) : ""}
            </span>
            <div className="flex w-full flex-1 items-end rounded-lg bg-slate-100">
              <div
                className="w-full rounded-lg bg-gradient-to-t from-emerald-600 to-emerald-400"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">{monthLabel(m.month)}</span>
            <span className="text-[10px] text-slate-400">{m.orders} orders</span>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal status distribution (orders share per fulfilment stage). */
export function StatusBars({ byStatus }: { byStatus: { status: string; orders: number; revenue: number }[] }) {
  const total = byStatus.reduce((sum, s) => sum + s.orders, 0);
  const colors: Record<string, string> = {
    pending: "bg-amber-400",
    confirmed: "bg-sky-500",
    shipped: "bg-violet-500",
    delivered: "bg-emerald-500",
    cancelled: "bg-slate-300",
  };
  if (total === 0) return <p className="mt-2 text-sm text-slate-500">No bookings yet.</p>;
  return (
    <div className="mt-4 space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {byStatus.map((s) => (
          <div
            key={s.status}
            className={colors[s.status] ?? "bg-slate-400"}
            style={{ width: `${(s.orders / total) * 100}%` }}
            title={`${s.status}: ${s.orders}`}
          />
        ))}
      </div>
      {byStatus.map((s) => (
        <div key={s.status} className="flex items-center gap-3 text-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${colors[s.status] ?? "bg-slate-400"}`} />
          <span className="w-24 capitalize font-semibold text-slate-700">{s.status}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${colors[s.status] ?? "bg-slate-400"}`}
              style={{ width: `${Math.max((s.orders / total) * 100, 2)}%` }}
            />
          </div>
          <span className="w-16 text-right text-xs text-slate-500">{s.orders} orders</span>
        </div>
      ))}
    </div>
  );
}
