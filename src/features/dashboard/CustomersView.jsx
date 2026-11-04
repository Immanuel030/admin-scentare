import { useEffect, useMemo, useState } from "react";
import { UserRound, X } from "lucide-react";
import { getCustomers, setCustomerActive } from "./customersApi.js";

const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

function formatMonth(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(`${String(dateValue).replace(" ", "T")}${String(dateValue).includes("Z") ? "" : "Z"}`);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(date);
}

function initials(name = "Customer") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function CustomerDetails({ customer, busy, onClose, onToggleStatus }) {
  const active = Number(customer.is_active) === 1;
  const details = [
    ["Email", customer.email || "—"],
    ["Phone", customer.phone || "Not provided"],
    ["Joined", formatMonth(customer.created_at)],
    ["Orders", Number(customer.orders_count || 0).toLocaleString("en-PH")],
    ["Total spent", currency.format(Number(customer.total_spent || 0))],
    ["Last order", formatMonth(customer.last_order_at)],
  ];
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="customer-details-title" className="my-auto w-full max-w-lg rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-start justify-between"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-full bg-[#e8e5df] text-sm font-semibold text-[#514b42]">{initials(customer.name)}</span><div><h2 id="customer-details-title" className="font-serif text-2xl text-[#f0ece5]">{customer.name}</h2><span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${active ? "bg-[#42734a]/20 text-[#83bd8b]" : "bg-[#873d35]/20 text-[#db8578]"}`}><span className="size-1.5 rounded-full bg-current" />{active ? "Active" : "Suspended"}</span></div></div><button onClick={onClose} className="grid size-9 place-items-center rounded-md text-[#aaa69f] hover:bg-white/5" aria-label="Close details"><X size={18} /></button></div><div className="divide-y divide-white/[.06] rounded-lg border border-white/[.06] px-4">{details.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 py-3"><span className="text-xs text-[#858078]">{label}</span><span className="text-right text-sm text-[#d7d2c9]">{value}</span></div>)}</div><div className="mt-5 flex justify-end"><button disabled={busy} onClick={() => onToggleStatus(customer)} className={`h-10 rounded-md border px-4 text-sm font-medium disabled:opacity-50 ${active ? "border-[#873d35]/30 text-[#db8578] hover:bg-[#873d35]/10" : "border-[#42734a]/30 text-[#83bd8b] hover:bg-[#42734a]/10"}`}>{busy ? "Updating…" : active ? "Suspend customer" : "Reactivate customer"}</button></div></section></div>;
}

export default function CustomersView({ search, onSearchChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      getCustomers({ page, status, search }).then((result) => {
        if (active) { setData(result); setPage(Number(result.page || 1)); setError(""); }
      }).catch((loadError) => {
        if (active) setError(loadError.message || "Could not load customer data.");
      }).finally(() => { if (active) setLoading(false); });
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [page, status, search]);

  const customers = data?.customers || [];
  const counts = data?.counts || { all: 0, active: 0, suspended: 0 };
  const shownPage = Number(data?.page || page);
  const pages = useMemo(() => {
    const pageCount = Number(data?.pageCount || 1);
    const start = Math.max(1, Math.min(shownPage - 2, pageCount - 4));
    return Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index);
  }, [data?.pageCount, shownPage]);

  async function refresh() {
    setLoading(true);
    setError("");
    try { setData(await getCustomers({ page, status, search })); }
    catch (loadError) { setError(loadError.message || "Could not load customer data."); }
    finally { setLoading(false); }
  }

  async function toggleStatus(customer) {
    const active = Number(customer.is_active) !== 1;
    setSavingId(customer.id);
    setError("");
    try {
      await setCustomerActive(customer.id, active);
      setSelectedCustomer((current) => current?.id === customer.id ? { ...current, is_active: active ? 1 : 0 } : current);
      await refresh();
    } catch (saveError) {
      setError(saveError.message || "Could not update customer status.");
    } finally {
      setSavingId(null);
    }
  }

  const start = Number(data?.total || 0) ? (shownPage - 1) * Number(data?.perPage || 10) + 1 : 0;
  const end = Math.min(shownPage * Number(data?.perPage || 10), Number(data?.total || 0));

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="mb-6"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">People</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Customers</h1><p className="mt-2 text-[13px] text-[#a09b93]">View, search, and manage registered client accounts.</p></div>
    {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]"><span>{error}</span><button onClick={refresh} className="ml-4 underline">Retry</button></div>}
    <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]">
      <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:items-center"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] sm:max-w-[360px]"><UserRound size={15} /><input value={search} onChange={(event) => { setPage(1); onSearchChange(event.target.value); }} placeholder="Search by name or email…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" /></label><div className="flex flex-wrap items-center gap-1 rounded-md border border-white/[.06] bg-[#101012] p-1">{[["all", "All"], ["active", "Active"], ["suspended", "Suspended"]].map(([value, label]) => <button key={value} onClick={() => { setPage(1); setStatus(value); }} className={`rounded px-3 py-1.5 text-xs ${status === value ? "bg-[#c9a954]/15 text-[#d8bc70]" : "text-[#8d8982] hover:text-[#eae6df]"}`}>{label}{value === "all" && <span className="ml-1.5 text-[10px] opacity-70">({Number(counts.all).toLocaleString("en-PH")})</span>}</button>)}</div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[770px] border-collapse text-left"><thead><tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]"><th className="px-5 py-3 font-medium">Customer</th><th className="py-3 pr-4 font-medium">Email</th><th className="py-3 pr-4 font-medium">Orders</th><th className="py-3 pr-4 font-medium">Total spent</th><th className="py-3 pr-4 font-medium">Joined</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-5 font-medium">Action</th></tr></thead><tbody className="divide-y divide-white/[.045]">{customers.map((customer) => { const active = Number(customer.is_active) === 1; return <tr key={customer.id} className="hover:bg-white/[.018]"><td className="px-5 py-3.5"><div className="flex min-w-[155px] items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8e5df] text-[11px] font-semibold text-[#514b42]">{initials(customer.name)}</span><span className="truncate text-sm font-medium text-[#e8e4dc]">{customer.name}</span></div></td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{customer.email}</td><td className="py-3.5 pr-4 text-sm text-[#c5c0b8]">{Number(customer.orders_count || 0).toLocaleString("en-PH")}</td><td className="py-3.5 pr-4 text-sm text-[#c5c0b8]">{currency.format(Number(customer.total_spent || 0))}</td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{formatMonth(customer.created_at)}</td><td className="py-3.5 pr-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${active ? "bg-[#42734a]/20 text-[#83bd8b]" : "bg-[#873d35]/20 text-[#db8578]"}`}><span className="size-1.5 rounded-full bg-current" />{active ? "Active" : "Suspended"}</span></td><td className="py-3.5 pr-5"><button onClick={() => setSelectedCustomer(customer)} className="text-xs font-medium text-[#d2b765] hover:text-[#f0d985]">View</button></td></tr>; })}</tbody></table>{loading && !data && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading customers…</p>}{!loading && customers.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">{search ? "No customers match your search." : "No customers found."}</p>}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] px-4 py-3.5 text-xs text-[#88837b] sm:px-5"><span>Showing {start}–{end} of {Number(data?.total || 0).toLocaleString("en-PH")} customers</span><nav aria-label="Customer pages" className="flex items-center gap-1"><button disabled={shownPage <= 1} onClick={() => setPage(Math.max(1, shownPage - 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Previous</button>{pages.map((pageNumber) => <button key={pageNumber} aria-current={pageNumber === shownPage ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`size-8 rounded border text-xs ${pageNumber === shownPage ? "border-[#c9a954]/50 text-[#d7bb6b]" : "border-white/10 text-[#aaa69f] hover:bg-white/[.04]"}`}>{pageNumber}</button>)}<button disabled={shownPage >= Number(data?.pageCount || 1)} onClick={() => setPage(Math.min(Number(data?.pageCount || 1), shownPage + 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Next</button></nav></div>
    </section>
    {selectedCustomer && <CustomerDetails customer={selectedCustomer} busy={savingId === selectedCustomer.id} onClose={() => setSelectedCustomer(null)} onToggleStatus={toggleStatus} />}
  </main>;
}
