import { useEffect, useState } from "react";
import { Pause, Play, Plus, Search, X } from "lucide-react";
import { requestJson } from "../../lib/api.js";

const filters = [["all", "All"], ["active", "Active"], ["scheduled", "Scheduled"], ["expired", "Expired"], ["paused", "Paused"]];
const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const statusStyle = { active: "bg-[#42734a]/20 text-[#83bd8b]", scheduled: "bg-[#9c792d]/20 text-[#d7b85c]", expired: "bg-white/[.08] text-[#aaa69f]", paused: "bg-[#873d35]/20 text-[#db8578]" };
const defaultStart = () => { const date = new Date(Date.now() + 5 * 60_000); date.setSeconds(0, 0); return date.toISOString().slice(0, 16); };
const emptyForm = () => ({ name: "", code: "", discount_type: "percentage", discount_value: "10", buy_quantity: "2", usage_limit: "", starts_at: defaultStart(), ends_at: "" });
const toInputDate = (value) => value ? String(value).replace(" ", "T").slice(0, 16) : "";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

function PromotionDialog({ promotion, onClose, onSaved }) {
  const [form, setForm] = useState(promotion ? { ...promotion, discount_value: String(promotion.discount_value), buy_quantity: String(promotion.buy_quantity), usage_limit: promotion.usage_limit == null ? "" : String(promotion.usage_limit), starts_at: toInputDate(promotion.starts_at), ends_at: toInputDate(promotion.ends_at) } : emptyForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = "mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#0e0e10] px-3 text-sm text-[#eeeae3] outline-none focus:border-[#c9a954]/60";

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const headers = await csrfHeaders();
      await requestJson("promotions.php", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ ...form, action: promotion ? "update" : "create", ...(promotion ? { id: promotion.id } : {}) }) });
      await onSaved();
    } catch (saveError) { setError(saveError.message || "Could not save this promotion."); }
    finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="promotion-dialog-title" className="my-auto w-full max-w-2xl rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">Sales</p><h2 id="promotion-dialog-title" className="mt-1 font-serif text-2xl text-[#f0ece5]">{promotion ? "Edit promotion" : "New promotion"}</h2><p className="mt-1 text-sm text-[#8f8a82]">Create a discount code and set when it can be used.</p></div><button onClick={onClose} aria-label="Close promotion form"><X size={18} /></button></div><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium text-[#b8b3aa] sm:col-span-2">Promotion name<input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={160} required /></label><label className="block text-xs font-medium text-[#b8b3aa]">Code<input className={`${field} uppercase`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} minLength={3} maxLength={40} required placeholder="WELCOME10" /></label><label className="block text-xs font-medium text-[#b8b3aa]">Promotion type<select className={field} value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}><option value="percentage">Percentage discount</option><option value="fixed">Fixed amount</option><option value="bundle">Bundle offer</option></select></label><label className="block text-xs font-medium text-[#b8b3aa]">{form.discount_type === "fixed" ? "Discount amount (PHP)" : "Discount (%)"}<input className={field} type="number" min="0.01" max={form.discount_type === "fixed" ? undefined : 100} step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required /></label>{form.discount_type === "bundle" && <label className="block text-xs font-medium text-[#b8b3aa]">Minimum items to qualify<input className={field} type="number" min="1" step="1" value={form.buy_quantity} onChange={(e) => setForm({ ...form, buy_quantity: e.target.value })} required /></label>}<label className="block text-xs font-medium text-[#b8b3aa]">Usage limit<input className={field} type="number" min="1" step="1" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" /></label><label className="block text-xs font-medium text-[#b8b3aa]">Starts at<input className={field} type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required /></label><label className="block text-xs font-medium text-[#b8b3aa]">Valid until<input className={field} type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></label></div>{error && <p role="alert" className="rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-[#e18b7e]">{error}</p>}<p className="text-[11px] text-[#77736d]">Leaving Valid until empty means the promotion has no end date.</p><div className="flex justify-end gap-2 border-t border-white/[.06] pt-4"><button type="button" onClick={onClose} className="h-10 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba]">Cancel</button><button disabled={busy} className="h-10 rounded-md bg-[#c9a954] px-4 text-sm font-semibold text-[#17140e] disabled:opacity-50">{busy ? "Saving…" : promotion ? "Save changes" : "Create promotion"}</button></div></form></section></div>;
}

function displayValue(promotion) {
  if (promotion.discount_type === "fixed") return `${currency.format(Number(promotion.discount_value))} off`;
  if (promotion.discount_type === "bundle") return `Buy ${promotion.buy_quantity}, get ${Number(promotion.discount_value)}% off`;
  return `${Number(promotion.discount_value)}% off`;
}
function displayType(value) { return value === "fixed" ? "Fixed amount" : value === "bundle" ? "Bundle" : "Percentage"; }
function displayDate(value) { return value ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${String(value).replace(" ", "T")}${String(value).includes("Z") ? "" : "Z"}`)) : "No expiry"; }

export default function PromotionsView({ search, onSearchChange }) {
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [busyId, setBusyId] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => requestJson(`promotions.php?${new URLSearchParams({ status: filter, search })}`)
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load promotions."); })
      .finally(() => { if (active) setLoading(false); }), 150);
    return () => { active = false; clearTimeout(timer); };
  }, [filter, search, reload]);

  const promotions = data?.promotions || [];
  const counts = data?.counts || {};
  async function refresh() { setReload((value) => value + 1); }
  async function toggle(promotion) {
    setBusyId(promotion.id); setError("");
    try {
      const headers = await csrfHeaders();
      await requestJson("promotions.php", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ id: promotion.id, action: Number(promotion.is_active) === 1 ? "disable" : "enable" }) });
      await refresh();
    } catch (toggleError) { setError(toggleError.message || "Could not update promotion status."); }
    finally { setBusyId(null); }
  }

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">Sales</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Promotions &amp; Discounts</h1><p className="mt-2 text-[13px] text-[#a09b93]">Create discount codes, seasonal sales, and bundle offers.</p></div><button onClick={() => setEditing(null)} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#c9a954] px-4 text-xs font-semibold text-[#17140e]"><Plus size={14} /> New promotion</button></div>{error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]">{error}<button onClick={() => setReload((n) => n + 1)} className="underline">Retry</button></div>}<section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]"><div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] lg:max-w-[360px]"><Search size={15} /><input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search promotions…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" /></label><div className="flex flex-wrap items-center gap-1 rounded-md border border-white/[.06] bg-[#101012] p-1">{filters.map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`rounded px-3 py-1.5 text-xs ${filter === key ? "bg-[#c9a954]/15 text-[#d8bc70]" : "text-[#8d8982] hover:text-[#eae6df]"}`}>{label}<span className="ml-1.5 text-[10px] opacity-70">{Number(counts[key] || 0).toLocaleString("en-PH")}</span></button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] border-collapse text-left"><thead><tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]"><th className="px-5 py-3 font-medium">Promotion</th><th className="py-3 pr-4 font-medium">Code</th><th className="py-3 pr-4 font-medium">Type</th><th className="py-3 pr-4 font-medium">Value</th><th className="py-3 pr-4 font-medium">Used</th><th className="py-3 pr-4 font-medium">Valid until</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-5 font-medium">Action</th></tr></thead><tbody className="divide-y divide-white/[.045]">{promotions.map((promotion) => <tr key={promotion.id} className="hover:bg-white/[.018]"><td className="px-5 py-3.5 text-xs font-medium text-[#e4dfd6]">{promotion.name}</td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{promotion.code}</td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{displayType(promotion.discount_type)}</td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{displayValue(promotion)}</td><td className="whitespace-nowrap py-3.5 pr-4 text-xs text-[#aaa69f]">{Number(promotion.usage_count || 0)} / {promotion.usage_limit == null ? "∞" : Number(promotion.usage_limit)}</td><td className="whitespace-nowrap py-3.5 pr-4 text-xs text-[#aaa69f]">{displayDate(promotion.ends_at)}</td><td className="py-3.5 pr-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusStyle[promotion.status]}`}>● &nbsp;{promotion.status[0].toUpperCase() + promotion.status.slice(1)}</span></td><td className="py-3.5 pr-5"><div className="flex items-center gap-3"><button onClick={() => setEditing(promotion)} className="text-xs font-medium text-[#d2b765] hover:text-[#f0d985]">Edit</button><button disabled={busyId === promotion.id} onClick={() => toggle(promotion)} title={Number(promotion.is_active) === 1 ? "Pause promotion" : "Enable promotion"} aria-label={`${Number(promotion.is_active) === 1 ? "Pause" : "Enable"} ${promotion.name}`} className="text-[#77736d] hover:text-[#d2b765] disabled:opacity-40">{busyId === promotion.id ? "…" : Number(promotion.is_active) === 1 ? <Pause size={14} /> : <Play size={14} />}</button></div></td></tr>)}</tbody></table>{loading && !data && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading promotions…</p>}{!loading && promotions.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">No promotions found.</p>}</div></section>{editing !== undefined && <PromotionDialog promotion={editing} onClose={() => setEditing(undefined)} onSaved={async () => { setEditing(undefined); await refresh(); }} />}</main>;
}
