import { useEffect, useState } from "react";
import { Bike, X } from "lucide-react";
import { getRiders, saveRider, setRiderActive, resetRiderPassword } from "./ridersApi.js";

const fieldClass = "mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#0e0e10] px-3 text-sm text-[#eeeae3] outline-none placeholder:text-[#69655f] focus:border-[#c9a954]/60";
const labelClass = "block text-xs font-medium text-[#b8b3aa]";

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(`${String(dateValue).replace(" ", "T")}${String(dateValue).includes("Z") ? "" : "Z"}`);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function initials(name = "Rider") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function RiderDialog({ rider, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: rider?.name || "",
    email: rider?.email || "",
    phone: rider?.phone || "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveRider({
        ...form,
        action: rider ? "update" : "create",
        ...(rider ? { id: rider.id } : {}),
      });
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Could not save this rider.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    setResetBusy(true);
    setResetMessage("");
    try {
      await resetRiderPassword(rider.id, resetPassword);
      setResetMessage("Password reset.");
      setResetPassword("");
    } catch (resetError) {
      setResetMessage(resetError.message || "Could not reset the password.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="rider-dialog-title" className="my-auto w-full max-w-lg rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">People</p>
            <h2 id="rider-dialog-title" className="mt-1 font-serif text-2xl text-[#f0ece5]">{rider ? "Edit rider" : "Add rider"}</h2>
            <p className="mt-1 text-sm text-[#8f8a82]">{rider ? "Update this rider's account details." : "Create a delivery account for a new rider."}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md text-[#aaa69f] hover:bg-white/5" aria-label="Close dialog"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className={labelClass}>Full name<input className={fieldClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={255} /></label>
          <label className={labelClass}>Email<input className={fieldClass} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required maxLength={255} /></label>
          <label className={labelClass}>Phone<input className={fieldClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} maxLength={255} placeholder="Optional" /></label>
          {!rider && (
            <label className={labelClass}>Password<input className={fieldClass} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} placeholder="At least 8 characters" /></label>
          )}
          {error && <p role="alert" className="rounded-md border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-[#e18b7e]">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-white/[.06] pt-4">
            <button type="button" onClick={onClose} className="h-10 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba] hover:bg-white/[.04]">Cancel</button>
            <button disabled={busy} className="h-10 rounded-md bg-[#c9a954] px-4 text-sm font-semibold text-[#17140e] disabled:cursor-wait disabled:opacity-60">{busy ? "Saving…" : rider ? "Save changes" : "Create rider"}</button>
          </div>
        </form>
        {rider && (
          <form onSubmit={submitReset} className="mt-5 space-y-3 border-t border-white/[.06] pt-4">
            <p className={labelClass}>Reset password</p>
            <div className="flex gap-2">
              <input className={fieldClass} type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} minLength={8} placeholder="New password (8+ characters)" />
              <button disabled={resetBusy || resetPassword.length < 8} className="h-10 shrink-0 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba] hover:bg-white/[.04] disabled:cursor-not-allowed disabled:opacity-50">{resetBusy ? "Resetting…" : "Reset"}</button>
            </div>
            {resetMessage && <p className="text-xs text-[#a09b93]">{resetMessage}</p>}
          </form>
        )}
      </section>
    </div>
  );
}

export default function RidersView({ search, onSearchChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [dialogRider, setDialogRider] = useState(undefined);
  const [savingId, setSavingId] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try { setData(await getRiders({ status, search })); }
    catch (loadError) { setError(loadError.message || "Could not load rider data."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      getRiders({ status, search }).then((result) => {
        if (active) { setData(result); setError(""); }
      }).catch((loadError) => {
        if (active) setError(loadError.message || "Could not load rider data.");
      }).finally(() => { if (active) setLoading(false); });
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [status, search]);

  const riders = data?.riders || [];
  const counts = data?.counts || { all: 0, active: 0, suspended: 0 };

  async function toggleStatus(rider) {
    const active = Number(rider.is_active) !== 1;
    setSavingId(rider.id);
    setError("");
    try {
      await setRiderActive(rider.id, active);
      await refresh();
    } catch (saveError) {
      setError(saveError.message || "Could not update rider status.");
    } finally {
      setSavingId(null);
    }
  }

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">People</p>
        <h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Riders</h1>
        <p className="mt-2 text-[13px] text-[#a09b93]">Create and manage delivery rider accounts.</p>
      </div>
      <button onClick={() => setDialogRider(null)} className="h-10 rounded-md bg-[#c9a954] px-4 text-sm font-semibold text-[#17140e] hover:bg-[#d7b762]">+ Add rider</button>
    </div>
    {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]"><span>{error}</span><button onClick={refresh} className="ml-4 underline">Retry</button></div>}
    <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]">
      <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:items-center">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] sm:max-w-[360px]">
          <Bike size={15} />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by name or email…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" />
        </label>
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-white/[.06] bg-[#101012] p-1">
          {[["all", "All"], ["active", "Active"], ["suspended", "Suspended"]].map(([value, label]) => (
            <button key={value} onClick={() => setStatus(value)} className={`rounded px-3 py-1.5 text-xs ${status === value ? "bg-[#c9a954]/15 text-[#d8bc70]" : "text-[#8d8982] hover:text-[#eae6df]"}`}>
              {label}{value === "all" && <span className="ml-1.5 text-[10px] opacity-70">({Number(counts.all).toLocaleString("en-PH")})</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]">
              <th className="px-5 py-3 font-medium">Rider</th>
              <th className="py-3 pr-4 font-medium">Email</th>
              <th className="py-3 pr-4 font-medium">Phone</th>
              <th className="py-3 pr-4 font-medium">Active deliveries</th>
              <th className="py-3 pr-4 font-medium">Completed</th>
              <th className="py-3 pr-4 font-medium">Joined</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.045]">
            {riders.map((rider) => {
              const active = Number(rider.is_active) === 1;
              return (
                <tr key={rider.id} className="hover:bg-white/[.018]">
                  <td className="px-5 py-3.5"><div className="flex min-w-[155px] items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8e5df] text-[11px] font-semibold text-[#514b42]">{initials(rider.name)}</span><span className="truncate text-sm font-medium text-[#e8e4dc]">{rider.name}</span></div></td>
                  <td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{rider.email}</td>
                  <td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{rider.phone || "—"}</td>
                  <td className="py-3.5 pr-4 text-sm text-[#c5c0b8]">{Number(rider.active_deliveries || 0).toLocaleString("en-PH")}</td>
                  <td className="py-3.5 pr-4 text-sm text-[#c5c0b8]">{Number(rider.completed_deliveries || 0).toLocaleString("en-PH")}</td>
                  <td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{formatDate(rider.created_at)}</td>
                  <td className="py-3.5 pr-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${active ? "bg-[#42734a]/20 text-[#83bd8b]" : "bg-[#873d35]/20 text-[#db8578]"}`}>
                      <span className="size-1.5 rounded-full bg-current" />{active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="py-3.5 pr-5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setDialogRider(rider)} className="text-xs font-medium text-[#d2b765] hover:text-[#f0d985]">Edit</button>
                      <button disabled={savingId === rider.id} onClick={() => toggleStatus(rider)} className={`text-xs font-medium disabled:opacity-50 ${active ? "text-[#db8578] hover:text-[#f0a999]" : "text-[#83bd8b] hover:text-[#9fd9a7]"}`}>
                        {savingId === rider.id ? "…" : active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && !data && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading riders…</p>}
        {!loading && riders.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">{search ? "No riders match your search." : "No rider accounts yet."}</p>}
      </div>
    </section>
    {dialogRider !== undefined && <RiderDialog rider={dialogRider} onClose={() => setDialogRider(undefined)} onSaved={refresh} />}
  </main>;
}
