import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { getActivity } from "./activityApi.js";

function initials(name = "System") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).replace(" ", "T")}${String(value).includes("Z") ? "" : "Z"}`);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function escapeCsv(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export default function ActivityLogsView({ search, onSearchChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [admin, setAdmin] = useState("");
  const [module, setModule] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      getActivity({ page, admin, module, search }).then((result) => {
        if (active) { setData(result); setPage(Number(result.page || 1)); setError(""); }
      }).catch((loadError) => {
        if (active) setError(loadError.message || "Could not load activity logs.");
      }).finally(() => { if (active) setLoading(false); });
    }, 160);
    return () => { active = false; clearTimeout(timer); };
  }, [page, admin, module, search]);

  const entries = data?.entries || [];
  const shownPage = Number(data?.page || page);
  const pages = useMemo(() => {
    const count = Number(data?.pageCount || 1);
    const start = Math.max(1, Math.min(shownPage - 2, count - 4));
    return Array.from({ length: Math.min(5, count) }, (_, index) => start + index);
  }, [data?.pageCount, shownPage]);
  const start = Number(data?.total || 0) ? (shownPage - 1) * Number(data?.perPage || 10) + 1 : 0;
  const end = Math.min(shownPage * Number(data?.perPage || 10), Number(data?.total || 0));

  async function refresh() {
    setLoading(true);
    setError("");
    try { setData(await getActivity({ page, admin, module, search })); }
    catch (loadError) { setError(loadError.message || "Could not load activity logs."); }
    finally { setLoading(false); }
  }

  async function exportLog() {
    setExporting(true);
    setError("");
    try {
      const result = await getActivity({ admin, module, search, exportAll: true });
      const records = [
        ["Admin", "Module", "Action", "Details", "Timestamp"],
        ...result.entries.map((entry) => [entry.actor_name, entry.module, entry.action, entry.details, entry.created_at]),
      ];
      const csv = records.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "scentare-activity-log.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError.message || "Could not export activity logs.");
    } finally {
      setExporting(false);
    }
  }

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">Insights</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Activity Logs</h1><p className="mt-2 text-[13px] text-[#a09b93]">Track admin actions across the system for accountability.</p></div><button disabled={exporting} onClick={exportLog} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/[.08] px-4 text-xs font-medium text-[#d3cec4] hover:bg-white/[.04] disabled:opacity-50"><Download size={14} />{exporting ? "Exporting…" : "Export log"}</button></div>
    {error && <div role="alert" className="no-print mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]"><span>{error}</span><button onClick={refresh} className="ml-4 underline">Retry</button></div>}
    <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]">
      <div className="no-print flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] lg:max-w-[360px]"><input value={search} onChange={(event) => { setPage(1); onSearchChange(event.target.value); }} placeholder="Search by admin or action…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" /><X size={13} className={search ? "cursor-pointer" : "hidden"} onClick={() => onSearchChange("")} /></label><select value={admin} onChange={(event) => { setPage(1); setAdmin(event.target.value); }} aria-label="Filter by admin" className="h-10 min-w-36 rounded-md border border-white/[.07] bg-[#101012] px-3 text-xs text-[#c9c4bb] outline-none"><option value="">All admins</option>{(data?.admins || []).map((name) => <option key={name} value={name}>{name}</option>)}</select><select value={module} onChange={(event) => { setPage(1); setModule(event.target.value); }} aria-label="Filter by module" className="h-10 min-w-36 rounded-md border border-white/[.07] bg-[#101012] px-3 text-xs text-[#c9c4bb] outline-none"><option value="">All modules</option>{(data?.modules || []).map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[880px] border-collapse text-left"><thead><tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]"><th className="px-5 py-3 font-medium">Admin</th><th className="py-3 pr-4 font-medium">Action</th><th className="py-3 pr-4 font-medium">Module</th><th className="py-3 pr-4 font-medium">Details</th><th className="py-3 pr-5 font-medium">Timestamp</th></tr></thead><tbody className="divide-y divide-white/[.045]">{entries.map((entry) => <tr key={entry.id} className="hover:bg-white/[.018]"><td className="px-5 py-3.5"><div className="flex min-w-[150px] items-center gap-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#27231b] text-[10px] text-[#d0ae64]">{initials(entry.actor_name)}</span><span className="truncate text-xs font-medium text-[#c9c4bb]">{entry.actor_name}</span></div></td><td className="py-3.5 pr-4 text-xs text-[#bcb7ae]">{entry.action}</td><td className="py-3.5 pr-4"><span className="rounded-full bg-white/[.07] px-2.5 py-1 text-[10px] text-[#b9b4ab]">• {entry.module}</span></td><td className="max-w-[350px] truncate py-3.5 pr-4 text-xs text-[#aaa69f]" title={entry.details}>{entry.details}</td><td className="whitespace-nowrap py-3.5 pr-5 text-xs text-[#aaa69f]">{formatTimestamp(entry.created_at)}</td></tr>)}</tbody></table>{loading && !data && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading activity…</p>}{!loading && entries.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">{error ? "Activity log data is unavailable." : "No admin activity has been recorded yet."}</p>}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] px-4 py-3.5 text-xs text-[#88837b] sm:px-5"><span>Showing {start}–{end} of {Number(data?.total || 0).toLocaleString("en-PH")} log entries</span><nav aria-label="Activity log pages" className="flex items-center gap-1"><button disabled={shownPage <= 1} onClick={() => setPage(Math.max(1, shownPage - 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Previous</button>{pages.map((pageNumber) => <button key={pageNumber} aria-current={pageNumber === shownPage ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`size-8 rounded border text-xs ${pageNumber === shownPage ? "border-[#c9a954]/50 text-[#d7bb6b]" : "border-white/10 text-[#aaa69f] hover:bg-white/[.04]"}`}>{pageNumber}</button>)}<button disabled={shownPage >= Number(data?.pageCount || 1)} onClick={() => setPage(Math.min(Number(data?.pageCount || 1), shownPage + 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Next</button></nav></div>
    </section>
  </main>;
}
