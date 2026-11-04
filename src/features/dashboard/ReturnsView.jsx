import { useEffect, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { requestJson } from "../../lib/api.js";

const filters = [["all", "All"], ["pending", "Requested"], ["approved", "Approved"], ["refunded", "Refunded"], ["rejected", "Rejected"]];
const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const styles = { pending: "bg-[#9c792d]/20 text-[#d7b85c]", approved: "bg-[#42734a]/20 text-[#83bd8b]", refunded: "bg-[#42734a]/20 text-[#83bd8b]", rejected: "bg-[#873d35]/20 text-[#db8578]" };
const labels = { pending: "Requested", approved: "Approved", refunded: "Refunded", rejected: "Rejected" };
const reasonLabel = (value = "other") => ({ damaged: "Damaged item", wrong_item: "Wrong item", missing_item: "Missing item", other: "Other" })[value] || value;
const fmtDate = (value) => value ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${String(value).replace(" ", "T")}${String(value).includes("Z") ? "" : "Z"}`)) : "—";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export default function ReturnsView({ search, onSearchChange, onUpdated }) {
  const [status, setStatus] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => requestJson(`returns.php?${new URLSearchParams({ status, search })}`)
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load return requests."); })
      .finally(() => { if (active) setLoading(false); }), 150);
    return () => { active = false; clearTimeout(timer); };
  }, [status, search, reload]);

  const requests = data?.requests || [];
  const stats = data?.stats || {};
  const counts = data?.counts || {};

  async function act(action) {
    if (!selected) return;
    setBusy(true); setError("");
    try {
      const headers = await csrfHeaders();
      await requestJson("returns.php", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ id: selected.id, action }) });
      setSelected(null);
      setReload((n) => n + 1);
      onUpdated?.();
    } catch (actionError) { setError(actionError.message || "Could not update this request."); }
    finally { setBusy(false); }
  }

  const cards = [
    ["Open requests", Number(stats.open_count || 0).toLocaleString("en-PH")],
    ["Approved this month", Number(stats.approved_month || 0).toLocaleString("en-PH")],
    ["Refunded amount", money.format(Number(stats.refunded_amount || 0))],
    ["Avg. resolution time", `${Number(stats.avg_resolution_days || 0).toFixed(1)} days`],
  ];

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="mb-6"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">Sales</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Returns &amp; Refunds</h1><p className="mt-2 text-[13px] text-[#a09b93]">Review and process customer issue requests.</p></div>
    {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]">{error}<button onClick={() => setReload((n) => n + 1)} className="underline">Retry</button></div>}
    <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(([label, value]) => <article key={label} className="rounded-lg border border-white/[.06] bg-[#131315] p-4"><p className="text-xs text-[#8d8982]">{label}</p><p className="mt-2 font-serif text-2xl text-[#eeeae3]">{loading ? "…" : value}</p></article>)}</section>
    <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]">
      <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] lg:max-w-[360px]"><Search size={15} /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by request, order or customer…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" /></label><div className="flex flex-wrap items-center gap-1 rounded-md border border-white/[.06] bg-[#101012] p-1">{filters.map(([value, label]) => <button key={value} onClick={() => setStatus(value)} className={`rounded px-3 py-1.5 text-xs ${status === value ? "bg-[#c9a954]/15 text-[#d8bc70]" : "text-[#8d8982] hover:text-[#eae6df]"}`}>{label}<span className="ml-1.5 text-[10px] opacity-70">{Number(counts[value] || 0).toLocaleString("en-PH")}</span></button>)}</div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-left"><thead><tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]"><th className="px-5 py-3 font-medium">Request</th><th className="py-3 pr-4 font-medium">Order</th><th className="py-3 pr-4 font-medium">Customer</th><th className="py-3 pr-4 font-medium">Reason</th><th className="py-3 pr-4 font-medium">Item</th><th className="py-3 pr-4 font-medium">Amount</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-5 font-medium">Action</th></tr></thead><tbody className="divide-y divide-white/[.045]">{requests.map((request) => <tr key={request.id} className="hover:bg-white/[.018]"><td className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold text-[#e4dfd6]">#RT-{String(request.id).padStart(4, "0")}</td><td className="whitespace-nowrap py-3.5 pr-4 text-xs text-[#d7d2c9]">#{request.order_number}</td><td className="py-3.5 pr-4 text-xs text-[#d7d2c9]">{request.customer}</td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{reasonLabel(request.type)}</td><td className="max-w-[170px] truncate py-3.5 pr-4 text-xs text-[#aaa69f]">{request.product_name || "Entire order"}</td><td className="whitespace-nowrap py-3.5 pr-4 text-xs text-[#d7d2c9]">{money.format(Number(request.amount) || 0)}</td><td className="py-3.5 pr-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${styles[request.status]}`}>● &nbsp;{labels[request.status] || request.status}</span></td><td className="py-3.5 pr-5"><button onClick={() => setSelected(request)} className="inline-flex items-center gap-1.5 rounded bg-[#c9a954] px-3 py-1.5 text-[11px] font-semibold text-[#17140e]"><Eye size={12} />{request.status === "pending" ? "Review" : "View"}</button></td></tr>)}</tbody></table>{loading && !data && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading return requests…</p>}{!loading && requests.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">No return requests found.</p>}</div>
      {requests.length >= 300 && <p className="border-t border-white/[.06] px-5 py-3 text-xs text-[#77736d]">Showing the latest 300 matching requests.</p>}
    </section>
    {selected && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section role="dialog" aria-modal="true" aria-labelledby="return-dialog-title" className="my-auto w-full max-w-xl rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">Return request · {labels[selected.status]}</p><h2 id="return-dialog-title" className="mt-1 font-serif text-2xl text-[#f0ece5]">#RT-{String(selected.id).padStart(4, "0")}</h2><p className="mt-1 text-sm text-[#88837b]">Order #{selected.order_number} · {fmtDate(selected.created_at)}</p></div><button onClick={() => setSelected(null)} aria-label="Close request details"><X size={18} /></button></div><div className="space-y-3 rounded-lg border border-white/[.06] bg-[#101012] p-4 text-sm"><p className="flex justify-between gap-3"><span className="text-[#88837b]">Customer</span><span className="text-right">{selected.customer}</span></p><p className="flex justify-between gap-3"><span className="text-[#88837b]">Reason</span><span>{reasonLabel(selected.type)}</span></p><p className="flex justify-between gap-3"><span className="text-[#88837b]">Item</span><span className="text-right">{selected.product_name || "Entire order"}</span></p><p className="flex justify-between gap-3 border-t border-white/[.06] pt-3"><span className="text-[#88837b]">Related amount</span><span>{money.format(Number(selected.amount) || 0)}</span></p><div className="border-t border-white/[.06] pt-3"><p className="mb-1 text-xs text-[#88837b]">Customer description</p><p className="whitespace-pre-wrap text-[#ddd8cf]">{selected.description}</p></div>{selected.admin_note && <p className="border-t border-white/[.06] pt-3 text-xs text-[#aaa69f]">Admin note: {selected.admin_note}</p>}{selected.photo_path && <a href={selected.photo_path} target="_blank" rel="noreferrer" className="inline-block border-t border-white/[.06] pt-3 text-xs text-[#d2b765] hover:text-[#f0d985]">View attached photo</a>}</div><p className="mt-3 text-[11px] leading-relaxed text-[#77736d]">Recording a refund updates the order’s payment status. It does not send money through a payment provider.</p><div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/[.06] pt-4"><button onClick={() => setSelected(null)} className="h-10 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba]">Close</button>{selected.status === "pending" && <><button disabled={busy} onClick={() => act("reject")} className="h-10 rounded-md border border-[#873d35]/30 px-4 text-xs text-[#db8578] disabled:opacity-50">Reject</button><button disabled={busy} onClick={() => act("approve")} className="h-10 rounded-md bg-[#c9a954] px-4 text-xs font-semibold text-[#17140e] disabled:opacity-50">Approve</button></>}{["pending", "approved"].includes(selected.status) && <button disabled={busy} onClick={() => act("refund")} className="h-10 rounded-md bg-[#42734a] px-4 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Record refund"}</button>}</div></section></div>}
  </main>;
}
