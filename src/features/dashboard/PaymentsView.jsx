import { useEffect, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { requestJson } from "../../lib/api.js";

const filters = [["all", "All"], ["pending", "Pending"], ["paid", "Verified"], ["failed", "Failed"], ["refunded", "Refunded"]];
const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const date = (value) => new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
const method = (value) => value === "cod" ? "Cash on delivery" : value === "online" ? "Online payment" : value;
const statusStyle = { pending: "bg-[#9c792d]/20 text-[#d7b85c]", paid: "bg-[#42734a]/20 text-[#83bd8b]", failed: "bg-[#873d35]/20 text-[#db8578]", refunded: "bg-white/[.08] text-[#aaa69f]" };

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export default function PaymentsView({ search, onSearchChange, onUpdated }) {
  const [status, setStatus] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => requestJson(`payments.php?${new URLSearchParams({ status, search })}`)
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((err) => { if (active) setError(err.message || "Could not load payments."); })
      .finally(() => { if (active) setLoading(false); }), 150);
    return () => { active = false; clearTimeout(timer); };
  }, [status, search, reload]);

  const payments = data?.payments || [];
  const counts = data?.counts || {};
  const stats = data?.stats || {};
  async function act(payment, action) {
    setBusyId(payment.id); setError("");
    try {
      const headers = await csrfHeaders();
      await requestJson("payments.php", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ id: payment.id, action }) });
      setReload((value) => value + 1);
      onUpdated?.();
      if (selected?.id === payment.id) setSelected(null);
    } catch (err) { setError(err.message || "Could not update this payment."); }
    finally { setBusyId(null); }
  }

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="mb-6"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">Sales</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Payments</h1><p className="mt-2 text-[13px] text-[#a09b93]">Verify transactions and flag failed or pending payments.</p></div>
    {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]">{error}<button onClick={() => setReload((value) => value + 1)} className="underline">Retry</button></div>}
    <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {[["Verified today", currency.format(stats.verified_today || 0), "text-[#eee8dc]"], ["Pending verification", Number(stats.pending_count || 0).toLocaleString("en-PH"), "text-[#d7b85c]"], ["Failed payments", Number(stats.failed_count || 0).toLocaleString("en-PH"), "text-[#db8578]"], ["Cash on delivery", `${Number(stats.cod_share || 0)}%`, "text-[#eee8dc]"]].map(([label, value, tone]) => <article key={label} className="rounded-lg border border-white/[.06] bg-[#131315] p-4 sm:p-5"><p className="text-xs font-medium text-[#88837b]">{label}</p><p className={`mt-2 font-serif text-[26px] leading-none ${tone}`}>{loading ? "…" : value}</p></article>)}
    </section>
    <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]">
      <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] lg:max-w-[360px]"><Search size={15} /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by order or reference no…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" /></label><div className="flex flex-wrap items-center gap-1 rounded-md border border-white/[.06] bg-[#101012] p-1">{filters.map(([value, label]) => <button key={value} onClick={() => setStatus(value)} className={`rounded px-3 py-1.5 text-xs ${status === value ? "bg-[#c9a954]/15 text-[#d8bc70]" : "text-[#8d8982] hover:text-[#eae6df]"}`}>{label}<span className="ml-1.5 text-[10px] opacity-70">{Number(counts[value] || 0).toLocaleString("en-PH")}</span></button>)}</div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[800px] border-collapse text-left"><thead><tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]"><th className="px-5 py-3 font-medium">Order</th><th className="py-3 pr-4 font-medium">Customer</th><th className="py-3 pr-4 font-medium">Method</th><th className="py-3 pr-4 font-medium">Date</th><th className="py-3 pr-4 font-medium">Amount</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-5 font-medium">Action</th></tr></thead><tbody className="divide-y divide-white/[.045]">{payments.map((payment) => <tr key={payment.id} className="hover:bg-white/[.018]"><td className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold text-[#e4dfd6]">#{payment.order_number}</td><td className="py-3.5 pr-4"><span className="block text-xs font-medium text-[#d7d2c9]">{payment.customer}</span><span className="mt-0.5 block text-[10px] text-[#77736d]">{payment.customer_email || ""}</span></td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{method(payment.payment_method)}</td><td className="whitespace-nowrap py-3.5 pr-4 text-xs text-[#aaa69f]">{date(payment.created_at)}</td><td className="whitespace-nowrap py-3.5 pr-4 text-xs font-semibold text-[#ddd8cf]">{currency.format(Number(payment.total) || 0)}</td><td className="py-3.5 pr-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${statusStyle[payment.payment_status]}`}>● &nbsp;{payment.payment_status === "paid" ? "Verified" : payment.payment_status[0].toUpperCase() + payment.payment_status.slice(1)}</span></td><td className="py-3.5 pr-5"><div className="flex items-center gap-3">{payment.payment_status === "pending" ? <button disabled={busyId === payment.id} onClick={() => act(payment, "verify")} className="rounded bg-[#c9a954] px-3 py-1.5 text-[11px] font-semibold text-[#17140e] disabled:opacity-50">{busyId === payment.id ? "Saving…" : "Verify"}</button> : payment.payment_status === "failed" ? <button disabled={busyId === payment.id} onClick={() => act(payment, "retry")} className="text-xs font-medium text-[#d2b765] disabled:opacity-50">Retry</button> : null}<button onClick={() => setSelected(payment)} aria-label={`View ${payment.order_number}`} className="text-xs text-[#aaa69f] hover:text-[#eae6df]"><Eye size={14} /></button></div></td></tr>)}</tbody></table>{loading && !data && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading payments…</p>}{!loading && payments.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">No payments found.</p>}</div>
      {payments.length >= 250 && <p className="border-t border-white/[.06] px-5 py-3 text-xs text-[#77736d]">Showing the latest 250 matching payments.</p>}
    </section>
    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section role="dialog" aria-modal="true" aria-labelledby="payment-detail-title" className="w-full max-w-md rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">Payment details</p><h2 id="payment-detail-title" className="mt-1 font-serif text-2xl text-[#f0ece5]">#{selected.order_number}</h2></div><button onClick={() => setSelected(null)} aria-label="Close payment details"><X size={18} /></button></div><p className="flex justify-between border-b border-white/[.06] py-3 text-sm"><span className="text-[#88837b]">Customer</span><span>{selected.customer}</span></p><p className="flex justify-between border-b border-white/[.06] py-3 text-sm"><span className="text-[#88837b]">Method</span><span>{method(selected.payment_method)}</span></p><p className="flex justify-between border-b border-white/[.06] py-3 text-sm"><span className="text-[#88837b]">Status</span><span>{selected.payment_status}</span></p><p className="flex justify-between py-3 text-sm"><span className="text-[#88837b]">Amount</span><span>{currency.format(Number(selected.total) || 0)}</span></p><p className="mt-2 text-[11px] text-[#77736d]">Payment status is recorded on the order. No external payment processor is connected.</p></section></div>}
  </main>;
}
