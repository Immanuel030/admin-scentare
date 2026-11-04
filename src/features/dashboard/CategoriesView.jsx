import { useEffect, useMemo, useState } from "react";
import { Archive, Flower2, Plus, X } from "lucide-react";
import { getCategories, saveCategory, setCategoryArchived } from "./categoriesApi.js";

function CategoryDialog({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveCategory({ action: category ? "update" : "create", ...(category ? { id: category.id } : {}), name, description });
      await onSaved();
    } catch (saveError) {
      setError(saveError.message || "Could not save this category.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#0e0e10] px-3 text-sm text-[#eeeae3] outline-none placeholder:text-[#69655f] focus:border-[#c9a954]/60";

  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="category-dialog-title" className="my-auto w-full max-w-lg rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">Catalog</p><h2 id="category-dialog-title" className="mt-1 font-serif text-2xl text-[#f0ece5]">{category ? "Edit category" : "Add category"}</h2><p className="mt-1 text-sm text-[#8f8a82]">Organize products into fragrance collections.</p></div>
        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md text-[#aaa69f] hover:bg-white/5" aria-label="Close dialog"><X size={18} /></button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-medium text-[#b8b3aa]">Category name<input className={field} value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} /></label>
        <label className="block text-xs font-medium text-[#b8b3aa]">Description<textarea className={`${field} h-28 resize-y py-2.5`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional details about this collection" /></label>
        {error && <p role="alert" className="rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-[#e18b7e]">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-white/[.06] pt-4"><button type="button" onClick={onClose} className="h-10 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba] hover:bg-white/[.04]">Cancel</button><button disabled={busy} className="h-10 rounded-md bg-[#c9a954] px-4 text-sm font-semibold text-[#17140e] disabled:opacity-60">{busy ? "Saving…" : category ? "Save changes" : "Create category"}</button></div>
      </form>
    </section>
  </div>;
}

export default function CategoriesView({ search, onSearchChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogCategory, setDialogCategory] = useState(undefined);
  const [savingId, setSavingId] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const result = await getCategories();
      setCategories(result.categories || []);
    } catch (loadError) {
      setError(loadError.message || "Could not load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getCategories().then((result) => { if (active) setCategories(result.categories || []); })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load categories."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => !query || `${category.name} ${category.description || ""}`.toLowerCase().includes(query));
  }, [categories, search]);
  const featured = filtered.filter((category) => Number(category.is_active) === 1).slice(0, 3);

  async function toggleArchived(category) {
    const archived = Number(category.is_active) === 1;
    setSavingId(category.id);
    setError("");
    try {
      await setCategoryArchived(category.id, archived);
      await refresh();
    } catch (saveError) {
      setError(saveError.message || "Could not update category visibility.");
    } finally {
      setSavingId(null);
    }
  }

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">Catalog</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Categories</h1><p className="mt-2 text-[13px] text-[#a09b93]">Organize perfumes into fragrance families and collections.</p></div><button onClick={() => setDialogCategory(null)} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#c9a954] px-4 text-sm font-semibold text-[#17140e] hover:bg-[#d7b762]"><Plus size={16} /> Add category</button></div>
    {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]"><span>{error}</span><button onClick={refresh} className="ml-4 underline">Retry</button></div>}

    <section className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {featured.map((category) => <article key={category.id} className="rounded-lg border border-white/[.06] bg-[#131315] p-4">
        <div className="flex items-center gap-3">{category.image ? <img src={category.image} alt="" className="size-10 rounded-md border border-white/10 bg-[#0d0d0f] object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="grid size-10 place-items-center rounded-md border border-white/10 bg-[#0d0d0f] text-[#8e7945]"><Flower2 size={18} /></span>}<div><h2 className="text-sm font-semibold text-[#e8e4dc]">{category.name}</h2><p className="mt-0.5 text-xs text-[#77736d]">{category.product_count} {Number(category.product_count) === 1 ? "product" : "products"}</p></div></div>
        <p className="mt-3 min-h-10 text-xs leading-relaxed text-[#9a958d]">{category.description || "A curated fragrance collection."}</p>
        <div className="mt-3 flex gap-2"><button onClick={() => setDialogCategory(category)} className="h-8 flex-1 rounded border border-white/[.08] text-xs font-medium text-[#d3cec4] hover:bg-white/[.04]">Edit</button><button disabled={savingId === category.id} onClick={() => toggleArchived(category)} className="h-8 rounded border border-[#873d35]/20 px-3 text-xs text-[#cf7f73] hover:bg-[#873d35]/10 disabled:opacity-40">Archive</button></div>
      </article>)}
      {!loading && featured.length === 0 && <div className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-[#88837b] md:col-span-2 xl:col-span-3">No visible categories match your search.</div>}
    </section>

    <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]"><div className="flex items-center justify-between gap-4 border-b border-white/[.06] px-4 py-4 sm:px-5"><div><h2 className="font-serif text-lg text-[#e8e4dc]">All categories</h2><p className="mt-1 text-xs text-[#77736d]">{filtered.length} categories in your catalog</p></div><label className="hidden max-w-xs flex-1 sm:block"><span className="sr-only">Search categories</span><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Filter categories…" className="h-9 w-full rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-xs text-[#eae6df] outline-none placeholder:text-[#69655f]" /></label></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[650px] border-collapse text-left"><thead><tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]"><th className="px-5 py-3 font-medium">Category</th><th className="py-3 pr-4 font-medium">Description</th><th className="py-3 pr-4 font-medium">Products</th><th className="py-3 pr-4 font-medium">Visibility</th><th className="py-3 pr-5 font-medium">Action</th></tr></thead><tbody className="divide-y divide-white/[.045]">{filtered.map((category) => { const visible = Number(category.is_active) === 1; return <tr key={category.id} className="hover:bg-white/[.018]"><td className="px-5 py-3.5 text-sm font-medium text-[#e4dfd6]">{category.name}</td><td className="max-w-[420px] truncate py-3.5 pr-4 text-xs text-[#99948b]">{category.description || "—"}</td><td className="py-3.5 pr-4 text-sm text-[#c5c0b8]">{category.product_count}</td><td className="py-3.5 pr-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${visible ? "bg-[#42734a]/20 text-[#83bd8b]" : "bg-white/[.07] text-[#aaa69f]"}`}><span className="size-1.5 rounded-full bg-current" />{visible ? "Visible" : "Hidden"}</span></td><td className="py-3.5 pr-5"><div className="flex items-center gap-3"><button onClick={() => setDialogCategory(category)} className="text-xs font-medium text-[#d2b765] hover:text-[#f0d985]">Edit</button><button disabled={savingId === category.id} onClick={() => toggleArchived(category)} aria-label={`${visible ? "Archive" : "Restore"} ${category.name}`} title={visible ? "Archive category" : "Restore category"} className="text-[#77736d] hover:text-[#d2b765] disabled:opacity-40"><Archive size={14} /></button></div></td></tr>; })}</tbody></table>{loading && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading categories…</p>}{!loading && filtered.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">No categories found.</p>}</div>
    </section>
    {dialogCategory !== undefined && <CategoryDialog category={dialogCategory} onClose={() => setDialogCategory(undefined)} onSaved={async () => { setDialogCategory(undefined); await refresh(); }} />}
  </main>;
}
