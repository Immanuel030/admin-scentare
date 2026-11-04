import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Package, Plus, X } from "lucide-react";
import { getProductsData, restockProduct } from "./productsApi.js";
import { getInventoryThresholds, saveInventoryThresholds } from "./inventoryApi.js";

const DEFAULT_THRESHOLDS = { low: 10, critical: 5 };

function ThresholdDialog({ thresholds, onClose, onSave }) {
  const [low, setLow] = useState(String(thresholds.low));
  const [critical, setCritical] = useState(String(thresholds.critical));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const invalid = !Number.isInteger(Number(low)) || !Number.isInteger(Number(critical)) || Number(low) <= Number(critical) || Number(critical) < 0;
  const field = "mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#0e0e10] px-3 text-sm text-[#eeeae3] outline-none focus:border-[#c9a954]/60";

  async function submit(event) {
    event.preventDefault();
    if (invalid) return;
    setBusy(true);
    setError("");
    try {
      await onSave({ low: Number(low), critical: Number(critical) });
    } catch (saveError) {
      setError(saveError.message || "Could not save thresholds.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="threshold-dialog-title" className="w-full max-w-md rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">Inventory</p><h2 id="threshold-dialog-title" className="mt-1 font-serif text-2xl text-[#f0ece5]">Alert thresholds</h2><p className="mt-1 text-sm text-[#8f8a82]">Set when products need attention.</p></div><button onClick={onClose} className="grid size-9 place-items-center rounded-md text-[#aaa69f] hover:bg-white/5" aria-label="Close dialog"><X size={18} /></button></div><form onSubmit={submit} className="space-y-4"><label className="block text-xs font-medium text-[#b8b3aa]">Low stock threshold<input className={field} type="number" min="1" step="1" value={low} onChange={(event) => setLow(event.target.value)} required /><span className="mt-1 block font-normal text-[#77736d]">Products at or below this quantity are flagged as low.</span></label><label className="block text-xs font-medium text-[#b8b3aa]">Critical threshold<input className={field} type="number" min="0" step="1" value={critical} onChange={(event) => setCritical(event.target.value)} required /><span className="mt-1 block font-normal text-[#77736d]">Products at or below this quantity are critical.</span></label>{invalid && <p role="alert" className="text-xs text-[#e18b7e]">Low threshold must be greater than the critical threshold.</p>}{error && <p role="alert" className="text-xs text-[#e18b7e]">{error}</p>}<div className="flex justify-end gap-2 border-t border-white/[.06] pt-4"><button type="button" onClick={onClose} className="h-10 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba]">Cancel</button><button disabled={invalid || busy} className="h-10 rounded-md bg-[#c9a954] px-4 text-sm font-semibold text-[#17140e] disabled:opacity-50">{busy ? "Saving…" : "Save thresholds"}</button></div></form></section></div>;
}

function RestockDialog({ product, onClose, onRestocked }) {
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await restockProduct(product.id, Number(quantity));
      await onRestocked();
    } catch (restockError) {
      setError(restockError.message || "Could not update inventory.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="restock-dialog-title" className="w-full max-w-md rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">Inventory</p><h2 id="restock-dialog-title" className="mt-1 font-serif text-2xl text-[#f0ece5]">Restock product</h2><p className="mt-1 text-sm text-[#8f8a82]">{product.name} · {product.stock} currently on hand</p></div><button onClick={onClose} className="grid size-9 place-items-center rounded-md text-[#aaa69f] hover:bg-white/5" aria-label="Close dialog"><X size={18} /></button></div><form onSubmit={submit} className="space-y-4"><label className="block text-xs font-medium text-[#b8b3aa]">Quantity to add<input autoFocus className="mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#0e0e10] px-3 text-sm text-[#eeeae3] outline-none focus:border-[#c9a954]/60" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>{error && <p role="alert" className="text-sm text-[#e18b7e]">{error}</p>}<div className="flex justify-end gap-2 border-t border-white/[.06] pt-4"><button type="button" onClick={onClose} className="h-10 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba]">Cancel</button><button disabled={busy} className="h-10 rounded-md bg-[#c9a954] px-4 text-sm font-semibold text-[#17140e] disabled:opacity-60">{busy ? "Updating…" : "Update stock"}</button></div></form></section></div>;
}

export default function InventoryView({ search, onSearchChange, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [restockProductItem, setRestockProductItem] = useState(null);

  useEffect(() => {
    let active = true;
    getInventoryThresholds().then((result) => { if (active) setThresholds(result); }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function refresh() {
    setLoading(true);
    setError("");
    try { setData(await getProductsData()); }
    catch (loadError) { setError(loadError.message || "Could not load inventory."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    getProductsData().then((result) => { if (active) setData(result); })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load inventory."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const products = useMemo(() => (data?.products || []).filter((product) => Number(product.is_active) === 1), [data]);
  const stats = useMemo(() => ({
    units: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
    low: products.filter((product) => Number(product.stock) > thresholds.critical && Number(product.stock) <= thresholds.low).length,
    critical: products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= thresholds.critical).length,
    out: products.filter((product) => Number(product.stock) === 0).length,
  }), [products, thresholds]);
  const filtered = useMemo(() => products.filter((product) => {
    const stock = Number(product.stock);
    const matchesFilter = filter === "all" || (filter === "low" ? stock > 0 && stock <= thresholds.low : stock === 0);
    const query = search.trim().toLowerCase();
    return matchesFilter && (!query || `${product.name} ${product.slug} ${product.brand || ""} ${product.category_name || ""}`.toLowerCase().includes(query));
  }).sort((a, b) => Number(a.stock) - Number(b.stock) || a.name.localeCompare(b.name)), [products, filter, thresholds, search]);

  async function saveThresholds(value) {
    await saveInventoryThresholds(value);
    setThresholds(value);
    setThresholdDialogOpen(false);
  }

  const cards = [
    { title: "Total units in stock", value: loading ? "…" : stats.units, tone: "text-[#eeeae3]" },
    { title: "Low-stock SKUs", value: loading ? "…" : stats.low, tone: "text-[#d7b85c]" },
    { title: "Critical SKUs", value: loading ? "…" : stats.critical, tone: "text-[#d27668]" },
    { title: "Out of stock", value: loading ? "…" : stats.out, tone: "text-[#c5a454]" },
  ];

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">Catalog</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Inventory</h1><p className="mt-2 text-[13px] text-[#a09b93]">Monitor stock levels and low-stock thresholds across every SKU.</p></div><button onClick={() => setThresholdDialogOpen(true)} className="h-10 rounded-md border border-white/[.08] px-4 text-xs font-medium text-[#d3cec4] hover:bg-white/[.04]">Set alert thresholds</button></div>
    {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]"><span>{error}</span><button onClick={refresh} className="ml-4 underline">Retry</button></div>}
    <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map((card) => <article key={card.title} className="rounded-lg border border-white/[.06] bg-[#131315] p-4"><p className="text-xs text-[#8d8982]">{card.title}</p><p className={`mt-2 font-serif text-2xl ${card.tone}`}>{card.value}</p></article>)}</section>

    <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]"><div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] lg:max-w-[360px]"><Package size={15} /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by product or SKU…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" /></label><div className="flex items-center gap-1 rounded-md border border-white/[.06] bg-[#101012] p-1">{[["all", "All"], ["low", "Low stock"], ["out", "Out of stock"]].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded px-3 py-1.5 text-xs ${filter === value ? "bg-[#c9a954]/15 text-[#d8bc70]" : "text-[#8d8982] hover:text-[#eae6df]"}`}>{label}</button>)}</div><span className="ml-auto hidden items-center gap-1.5 text-xs text-[#8a857d] lg:inline-flex"><AlertTriangle size={13} className="text-[#c9a954]" /> Low ≤ {thresholds.low} · Critical ≤ {thresholds.critical}</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[780px] border-collapse text-left"><thead><tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]"><th className="px-5 py-3 font-medium">Product</th><th className="py-3 pr-4 font-medium">SKU</th><th className="py-3 pr-4 font-medium">On hand</th><th className="py-3 pr-4 font-medium">Threshold</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-4 font-medium">Last updated</th><th className="py-3 pr-5 font-medium">Action</th></tr></thead><tbody className="divide-y divide-white/[.045]">{filtered.map((product) => { const stock = Number(product.stock); const isCritical = stock > 0 && stock <= thresholds.critical; const isLow = stock > thresholds.critical && stock <= thresholds.low; const out = stock === 0; const date = product.updated_at || product.created_at; return <tr key={product.id} className="hover:bg-white/[.018]"><td className="px-5 py-3.5"><div className="flex min-w-[200px] items-center gap-3">{product.image ? <img src={product.image} alt="" className="size-10 shrink-0 rounded-md border border-white/10 bg-[#0d0d0f] object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-[#0d0d0f] text-[#8e7945]"><Package size={17} /></span>}<div className="min-w-0"><p className="truncate text-sm font-medium text-[#e8e4dc]">{product.name}{product.size_ml ? ` ${product.size_ml}ml` : ""}</p><p className="mt-0.5 truncate text-[11px] text-[#77736d]">{product.category_name || "Uncategorized"}</p></div></div></td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{product.slug}</td><td className={`py-3.5 pr-4 text-sm font-semibold ${out || isCritical ? "text-[#d27668]" : isLow ? "text-[#d7b85c]" : "text-[#c5c0b8]"}`}>{stock}</td><td className="py-3.5 pr-4 text-sm text-[#8d8982]">{thresholds.low}</td><td className="py-3.5 pr-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${out || isCritical ? "bg-[#873d35]/20 text-[#db8578]" : isLow ? "bg-[#81672c]/20 text-[#d4b358]" : "bg-[#42734a]/20 text-[#83bd8b]"}`}><span className="size-1.5 rounded-full bg-current" />{out ? "Out of stock" : isCritical ? "Critical" : isLow ? "Low" : "Healthy"}</span></td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{date ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(String(date).replace(" ", "T") + (String(date).includes("Z") ? "" : "Z"))) : "—"}</td><td className="py-3.5 pr-5"><button onClick={() => setRestockProductItem(product)} className={`h-8 rounded-md px-3 text-xs font-medium ${out || isCritical || isLow ? "bg-[#c9a954] text-[#17140e] hover:bg-[#d7b762]" : "border border-white/[.08] text-[#c9c4bb] hover:bg-white/[.04]"}`}><Plus size={12} className="mr-1 inline" />Restock</button></td></tr>; })}</tbody></table>{loading && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading inventory…</p>}{!loading && filtered.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">No products match this inventory filter.</p>}</div>
      <div className="border-t border-white/[.06] px-5 py-3.5 text-xs text-[#88837b]">Showing {filtered.length} active {filtered.length === 1 ? "SKU" : "SKUs"}</div>
    </section>
    {thresholdDialogOpen && <ThresholdDialog thresholds={thresholds} onClose={() => setThresholdDialogOpen(false)} onSave={saveThresholds} />}
    {restockProductItem && <RestockDialog product={restockProductItem} onClose={() => setRestockProductItem(null)} onRestocked={async () => { setRestockProductItem(null); await refresh(); onUpdated?.(); }} />}
  </main>;
}
