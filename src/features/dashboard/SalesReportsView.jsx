import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { getReports } from "./reportsApi.js";

const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const ranges = [[7, "Last 7 days"], [30, "Last 30 days"], [90, "Last 90 days"], [365, "Last 12 months"]];
const blank = { summary: {}, previous: {}, trend: [], bestSellers: [], byCategory: [] };

function percentChange(current, previous) {
  if (!previous) return current ? "New" : "No change";
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function RevenueChart({ trend }) {
  const max = Math.max(1, ...trend.map((item) => Number(item.revenue) || 0));
  const points = trend.map((item, index) => ({
    ...item,
    x: trend.length < 2 ? 500 : 8 + (index * 984) / (trend.length - 1),
    y: 200 - ((Number(item.revenue) || 0) / max) * 156,
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = points.length ? `M${points[0].x},204 ${points.map((point) => `L${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")} L${points.at(-1).x},204 Z` : "";
  const ticks = trend.length ? [trend[0], trend[Math.floor((trend.length - 1) / 3)], trend[Math.floor(((trend.length - 1) * 2) / 3)], trend.at(-1)] : [];
  return <div className="mt-4">
    <div className="h-52 w-full">
      <svg viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label="Revenue trend chart" className="h-full w-full overflow-visible">
        <defs><linearGradient id="salesRevenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c6a044" stopOpacity=".32" /><stop offset="100%" stopColor="#c6a044" stopOpacity="0" /></linearGradient></defs>
        {[44, 96, 148, 204].map((y) => <line key={y} x1="8" x2="992" y1={y} y2={y} stroke="rgba(255,255,255,.055)" strokeDasharray={y === 204 ? "0" : "4 6"} />)}
        {area && <path d={area} fill="url(#salesRevenueFill)" />}
        {line && <path d={line} fill="none" stroke="#c6a044" strokeWidth="3" vectorEffect="non-scaling-stroke" />}
        {points.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="3.5" fill="#d9b85d"><title>{`${point.date}: ${currency.format(Number(point.revenue) || 0)}`}</title></circle>)}
      </svg>
    </div>
    <div className="mt-2 flex justify-between text-[11px] text-[#77736d]">{ticks.map((tick, index) => <span key={`${tick.date}-${index}`}>{new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(`${tick.date}T00:00:00`))}</span>)}</div>
  </div>;
}

export default function SalesReportsView({ search }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getReports(days).then((result) => { if (active) { setData(result); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load sales reports."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [days, reloadKey]);

  const report = data || blank;
  const bestSellers = useMemo(() => report.bestSellers.filter((item) => `${item.name}`.toLowerCase().includes(search.trim().toLowerCase())), [report.bestSellers, search]);
  const categories = useMemo(() => report.byCategory.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase())), [report.byCategory, search]);
  const categoryTotal = categories.reduce((sum, category) => sum + Number(category.revenue || 0), 0);
  const summary = report.summary;
  const previous = report.previous;
  const stats = [
    { label: "Gross revenue", value: currency.format(Number(summary.revenue) || 0), change: `${percentChange(Number(summary.revenue) || 0, Number(previous.revenue) || 0)} vs prior period`, positive: Number(summary.revenue) >= Number(previous.revenue) },
    { label: "Orders", value: Number(summary.orders || 0).toLocaleString("en-PH"), change: `${percentChange(Number(summary.orders) || 0, Number(previous.orders) || 0)} vs prior period`, positive: Number(summary.orders) >= Number(previous.orders) },
    { label: "Avg. order value", value: currency.format(Number(summary.average_order_value) || 0), change: `${percentChange(Number(summary.average_order_value) || 0, Number(previous.average_order_value) || 0)} vs prior period`, positive: Number(summary.average_order_value) >= Number(previous.average_order_value) },
    { label: "Return rate", value: `${(Number(summary.return_rate) || 0).toFixed(1)}%`, change: `${((Number(summary.return_rate) || 0) - (Number(previous.return_rate) || 0)).toFixed(1)} pp vs prior period`, positive: Number(summary.return_rate) <= Number(previous.return_rate) },
  ];

  function downloadPdf() { window.print(); }

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">Insights</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Sales &amp; Reports</h1><p className="mt-2 text-[13px] text-[#a09b93]">Sales summaries, best sellers, and performance over time.</p></div><div className="flex gap-2"><select aria-label="Sales report date range" value={days} onChange={(event) => { setLoading(true); setDays(Number(event.target.value)); }} className="h-10 rounded-md border border-white/[.08] bg-[#111113] px-3 text-xs text-[#d3cec4] outline-none focus:border-[#c9a954]/60">{ranges.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button onClick={downloadPdf} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/[.08] px-3 text-xs font-medium text-[#d3cec4] hover:bg-white/[.04]"><Download size={14} /> Download PDF</button></div></div>
    {error && <div role="alert" className="no-print mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]"><span>{error}</span><button onClick={() => setReloadKey((value) => value + 1)} className="ml-4 underline">Retry</button></div>}
    <p className="mb-3 hidden text-xs text-[#77736d] print:block">Report period: {report.startDate || "—"} to {report.endDate || "—"}</p>
    <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">{stats.map((stat) => <article key={stat.label} className="rounded-lg border border-white/[.06] bg-[#131315] p-4"><p className="text-xs text-[#8d8982]">{stat.label}</p><p className="mt-2 font-serif text-[25px] leading-tight text-[#eeeae3]">{loading ? "…" : stat.value}</p><p className={`mt-2 text-[11px] ${stat.positive ? "text-[#78b786]" : "text-[#d27668]"}`}>{stat.change}</p></article>)}</section>
    <section className="mb-4 rounded-xl border border-white/[.06] bg-[#131315] p-4 sm:p-5"><h2 className="font-serif text-lg text-[#e8e4dc]">Revenue trend</h2><RevenueChart trend={report.trend} /></section>
    <section className="grid gap-4 lg:grid-cols-2"><article className="rounded-xl border border-white/[.06] bg-[#131315] p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-lg text-[#e8e4dc]">Best sellers</h2><span className="text-xs text-[#77736d]">{ranges.find(([value]) => value === days)?.[1]}</span></div><div className="grid grid-cols-[1fr_90px_110px] gap-3 border-b border-white/[.06] py-2 text-[10px] uppercase tracking-wide text-[#77736d]"><span>Product</span><span>Units sold</span><span className="text-right">Revenue</span></div>{bestSellers.map((product) => <div key={product.name} className="grid grid-cols-[1fr_90px_110px] gap-3 border-b border-white/[.04] py-3 text-xs last:border-0"><span className="truncate font-medium text-[#ddd8cf]">{product.name}</span><span className="text-[#aaa69f]">{Number(product.units_sold).toLocaleString("en-PH")}</span><span className="text-right text-[#d3cec4]">{currency.format(Number(product.revenue) || 0)}</span></div>)}{!loading && bestSellers.length === 0 && <p className="py-7 text-center text-sm text-[#88837b]">No sales data for this period.</p>}</article>
      <article className="rounded-xl border border-white/[.06] bg-[#131315] p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-lg text-[#e8e4dc]">Sales by category</h2><span className="text-xs text-[#77736d]">Revenue share</span></div>{categories.map((category) => { const share = categoryTotal ? (Number(category.revenue) / categoryTotal) * 100 : 0; return <div key={category.name} className="border-b border-white/[.04] py-3 last:border-0"><div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="truncate text-[#ddd8cf]">{category.name}</span><span className="shrink-0 text-[#aaa69f]">{share.toFixed(0)}% · {currency.format(Number(category.revenue) || 0)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-[#b99742]" style={{ width: `${share}%` }} /></div></div>; })}{!loading && categories.length === 0 && <p className="py-7 text-center text-sm text-[#88837b]">No category sales for this period.</p>}</article></section>
  </main>;
}
