import { useEffect, useMemo, useState } from "react";
import { Archive, Download, Package, Plus, Search, X } from "lucide-react";
import { getProductsData, saveProduct, setProductArchived } from "./productsApi.js";

const emptyProducts = [];
const emptyCategories = [];
const initialForm = {
  name: "",
  brand: "",
  category_id: "",
  price: "",
  stock: "",
  size_ml: "",
  image: "",
};
const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function ProductDialog({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(product ? {
    name: product.name,
    brand: product.brand || "",
    category_id: product.category_id || "",
    price: product.price,
    stock: product.stock,
    size_ml: product.size_ml || "",
    image: product.image || "",
  } : initialForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveProduct({
        ...form,
        action: product ? "update" : "create",
        ...(product ? { id: product.id } : {}),
      });
      await onSaved();
    } catch (saveError) {
      setError(saveError.message || "Could not save this product.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = "mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#0e0e10] px-3 text-sm text-[#eeeae3] outline-none placeholder:text-[#69655f] focus:border-[#c9a954]/60";
  const labelClass = "block text-xs font-medium text-[#b8b3aa]";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" className="my-auto w-full max-w-xl rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">Catalog</p>
            <h2 id="product-dialog-title" className="mt-1 font-serif text-2xl text-[#f0ece5]">{product ? "Edit product" : "Add product"}</h2>
            <p className="mt-1 text-sm text-[#8f8a82]">Save changes directly to the product catalog.</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md text-[#aaa69f] hover:bg-white/5" aria-label="Close dialog"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${labelClass} sm:col-span-2`}>Product name<input className={fieldClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={255} /></label>
            <label className={labelClass}>Brand<input className={fieldClass} value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} maxLength={255} placeholder="Optional" /></label>
            <label className={labelClass}>Category<select className={fieldClass} value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className={labelClass}>Price (PHP)<input className={fieldClass} type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label>
            <label className={labelClass}>Stock<input className={fieldClass} type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required /></label>
            <label className={labelClass}>Bottle size (ml)<input className={fieldClass} type="number" min="1" step="1" value={form.size_ml} onChange={(event) => setForm({ ...form, size_ml: event.target.value })} placeholder="Optional" /></label>
            <label className={`${labelClass} sm:col-span-2`}>Image URL<input className={fieldClass} type="url" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} maxLength={255} placeholder="https://… (optional)" /></label>
          </div>
          {error && <p role="alert" className="rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-[#e18b7e]">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-white/[.06] pt-4">
            <button type="button" onClick={onClose} className="h-10 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba] hover:bg-white/[.04]">Cancel</button>
            <button disabled={busy} className="h-10 rounded-md bg-[#c9a954] px-4 text-sm font-semibold text-[#17140e] disabled:cursor-wait disabled:opacity-60">{busy ? "Saving…" : product ? "Save changes" : "Create product"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function ProductsView({ search, onSearchChange, openAdd, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogProduct, setDialogProduct] = useState(() => openAdd ? null : undefined);
  const [savingId, setSavingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setData(await getProductsData());
    } catch (loadError) {
      setError(loadError.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getProductsData().then((result) => { if (active) setData(result); })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load products."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const products = data?.products || emptyProducts;
  const categories = data?.categories || emptyCategories;
  const counts = useMemo(() => ({
    all: products.length,
    active: products.filter((product) => Number(product.is_active) === 1).length,
    archived: products.filter((product) => Number(product.is_active) !== 1).length,
  }), [products]);
  const filtered = useMemo(() => products.filter((product) => {
    const matchesStatus = status === "all" || (status === "active"
      ? Number(product.is_active) === 1
      : Number(product.is_active) !== 1);
    const matchesCategory = categoryId === "all" || String(product.category_id || "") === categoryId;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${product.name} ${product.brand || ""} ${product.category_name || ""} ${product.slug}`.toLowerCase().includes(query);
    return matchesStatus && matchesCategory && matchesSearch;
  }), [products, status, categoryId, search]);
  const perPage = 6;
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pageCount);
  const pageProducts = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const pageIds = pageProducts.map((product) => String(product.id));
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  function toggleSelection(id) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(String(id))) next.delete(String(id));
      else next.add(String(id));
      return next;
    });
  }

  function togglePageSelection() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function toggleArchived(product) {
    const archived = Number(product.is_active) === 1;
    setSavingId(product.id);
    setError("");
    try {
      await setProductArchived(product.id, archived);
      await refresh();
      onUpdated?.();
    } catch (saveError) {
      setError(saveError.message || "Could not update product status.");
    } finally {
      setSavingId(null);
    }
  }

  function exportCsv() {
    const rows = [
      ["Product", "Category", "Price", "Stock", "Status"],
      ...filtered.map((product) => [product.name, product.category_name || "", product.price, product.stock, Number(product.is_active) ? (Number(product.stock) <= 5 ? "Low stock" : "Active") : "Archived"]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "scentare-products.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">Catalog</p>
          <h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Products</h1>
          <p className="mt-2 text-[13px] text-[#a09b93]">Add, edit, archive, and price every perfume in the catalog.</p>
        </div>
        <button onClick={() => setDialogProduct(null)} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#c9a954] px-4 text-sm font-semibold text-[#17140e] hover:bg-[#d7b762]"><Plus size={16} /> Add product</button>
      </div>

      {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]"><span>{error}</span><button onClick={refresh} className="ml-4 underline">Retry</button></div>}

      <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]">
        <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] lg:max-w-[360px]">
            <Search size={15} />
            <input value={search} onChange={(event) => { setPage(1); onSearchChange(event.target.value); }} placeholder="Search products…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" />
          </label>
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-white/[.06] bg-[#101012] p-1">
            {[['all', 'All'], ['active', 'Active'], ['archived', 'Archived']].map(([value, label]) => <button key={value} onClick={() => { setPage(1); setStatus(value); }} className={`rounded px-2.5 py-1.5 text-xs transition-colors ${status === value ? 'bg-[#c9a954]/15 text-[#d8bc70]' : 'text-[#8d8982] hover:text-[#eae6df]'}`}>{label} <span className="ml-1 text-[10px] opacity-70">{counts[value]}</span></button>)}
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            <select value={categoryId} onChange={(event) => { setPage(1); setCategoryId(event.target.value); }} aria-label="Filter by category" className="h-10 min-w-36 rounded-md border border-white/[.07] bg-[#101012] px-3 text-xs text-[#c9c4bb] outline-none focus:border-[#c9a954]/60">
              <option value="all">All categories</option>
              <option value="">Uncategorized</option>
              {categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name}</option>)}
            </select>
            <button onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/[.08] px-3 text-xs text-[#c9c4bb] hover:bg-white/[.04]"><Download size={14} /> Export CSV</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead><tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]">
              <th className="w-12 px-5 py-3"><input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} aria-label="Select all products on this page" className="accent-[#c9a954]" /></th>
              <th className="py-3 pr-4 font-medium">Product</th><th className="py-3 pr-4 font-medium">Category</th><th className="py-3 pr-4 font-medium">Price</th><th className="py-3 pr-4 font-medium">Stock</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-5 font-medium">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-white/[.045]">
              {pageProducts.map((product) => {
                const archived = Number(product.is_active) !== 1;
                const lowStock = Number(product.stock) <= 5;
                return <tr key={product.id} className="group hover:bg-white/[.018]">
                  <td className="px-5 py-3.5"><input type="checkbox" checked={selectedIds.has(String(product.id))} onChange={() => toggleSelection(product.id)} aria-label={`Select ${product.name}`} className="accent-[#c9a954]" /></td>
                  <td className="py-3.5 pr-4"><div className="flex min-w-[220px] items-center gap-3">
                    {product.image ? <img src={product.image} alt="" className="size-10 shrink-0 rounded-md border border-white/10 bg-[#0d0d0f] object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-[#0d0d0f] text-[#8e7945]"><Package size={17} /></span>}
                    <span className="min-w-0"><span className="block truncate text-sm font-medium text-[#e8e4dc]">{product.name}</span><span className="mt-0.5 block truncate text-[11px] text-[#77736d]">{product.size_ml ? `${product.size_ml} ml` : "Perfume"}{product.slug ? ` · SKU ${product.slug}` : ""}</span></span>
                  </div></td>
                  <td className="py-3.5 pr-4 text-sm text-[#aaa69f]">{product.category_name || "—"}</td>
                  <td className="py-3.5 pr-4 text-sm font-medium text-[#e2ddd3]">{money.format(Number(product.price) || 0)}</td>
                  <td className="py-3.5 pr-4 text-sm text-[#c5c0b8]">{product.stock}</td>
                  <td className="py-3.5 pr-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${archived ? "bg-white/[.07] text-[#aaa69f]" : lowStock ? "bg-[#873d35]/20 text-[#db8578]" : "bg-[#42734a]/20 text-[#83bd8b]"}`}><span className="size-1.5 rounded-full bg-current" />{archived ? "Archived" : lowStock ? "Low stock" : "Active"}</span></td>
                  <td className="py-3.5 pr-5"><div className="flex items-center gap-3"><button onClick={() => setDialogProduct(product)} className="text-xs font-medium text-[#d2b765] hover:text-[#f0d985]">Edit</button><button disabled={savingId === product.id} onClick={() => toggleArchived(product)} title={archived ? "Restore product" : "Archive product"} aria-label={`${archived ? "Restore" : "Archive"} ${product.name}`} className="text-[#77736d] hover:text-[#d2b765] disabled:opacity-40"><Archive size={14} /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
          {loading && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading catalog…</p>}
          {!loading && pageProducts.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">{error ? "Product data is unavailable." : "No products match your filters."}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] px-4 py-3.5 text-xs text-[#88837b] sm:px-5">
          <span>{selectedIds.size ? `${selectedIds.size} selected · ` : ""}Showing {filtered.length ? (currentPage - 1) * perPage + 1 : 0}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length} products</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Previous</button>
            <span className="min-w-7 rounded border border-[#c9a954]/50 px-2 py-1.5 text-center text-[#d7bb6b]">{currentPage}</span>
            <button disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Next</button>
          </div>
        </div>
      </section>

      {dialogProduct !== undefined && <ProductDialog product={dialogProduct} categories={categories} onClose={() => setDialogProduct(undefined)} onSaved={async () => { setDialogProduct(undefined); await refresh(); onUpdated?.(); }} />}
    </main>
  );
}
