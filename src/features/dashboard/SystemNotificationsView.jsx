import { useEffect, useState } from "react";
import { Plus, Send, X } from "lucide-react";
import { requestJson } from "../../lib/api.js";

const triggers = [
  ["order_confirmation", "Order confirmation", "Send when an order is confirmed."],
  ["shipping_updates", "Shipping status updates", "Send on shipped, out for delivery, and delivered."],
  ["back_in_stock", "Back in stock alerts", "Notify customers who wishlisted a restocked product."],
  ["abandoned_cart", "Abandoned cart reminder", "Requires a background scheduler; unavailable in this app."],
];
const categories = ["Restock", "Order update", "Promo", "Payment"];
const dateTime = (value) => value ? new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(`${String(value).replace(" ", "T")}${String(value).includes("Z") ? "" : "Z"}`)) : "—";
const chipColors = { Restock: "bg-[#81672c]/20 text-[#d4b358]", "Order update": "bg-[#42734a]/20 text-[#83bd8b]", Promo: "bg-white/[.08] text-[#c8c3ba]", Payment: "bg-[#873d35]/20 text-[#db8578]" };

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

function ComposeDialog({ onClose, onSent }) {
  const [category, setCategory] = useState("Order update");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const headers = await csrfHeaders();
      const result = await requestJson("system_notifications.php", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ action: "compose", category, title, message }) });
      await onSent(result.message);
    } catch (sendError) { setError(sendError.message || "Could not send this notification."); }
    finally { setBusy(false); }
  }
  const field = "mt-1.5 h-10 w-full rounded-md border border-white/10 bg-[#0e0e10] px-3 text-sm text-[#eeeae3] outline-none placeholder:text-[#69655f] focus:border-[#c9a954]/60";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="compose-notification-title" className="w-full max-w-lg rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">System</p><h2 id="compose-notification-title" className="mt-1 font-serif text-2xl text-[#f0ece5]">Compose notification</h2><p className="mt-1 text-sm text-[#8f8a82]">Send an in-app message to all active customers.</p></div><button onClick={onClose} aria-label="Close composer"><X size={18} /></button></div><form onSubmit={submit} className="space-y-4"><label className="block text-xs font-medium text-[#b8b3aa]">Category<select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block text-xs font-medium text-[#b8b3aa]">Title<input className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required /></label><label className="block text-xs font-medium text-[#b8b3aa]">Message<textarea className={`${field} h-28 resize-y py-2.5`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} required /></label>{error && <p role="alert" className="text-sm text-[#e18b7e]">{error}</p>}<div className="flex justify-end gap-2 border-t border-white/[.06] pt-4"><button type="button" onClick={onClose} className="h-10 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba]">Cancel</button><button disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#c9a954] px-4 text-xs font-semibold text-[#17140e] disabled:opacity-50"><Send size={13} />{busy ? "Sending…" : "Send to customers"}</button></div></form></section></div>;
}

export default function SystemNotificationsView({ search, onSearchChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [compose, setCompose] = useState(false);
  const [notice, setNotice] = useState("");

  async function refresh() {
    setError("");
    try { const result = await requestJson("system_notifications.php"); setData(result); setSettings(result.settings || {}); }
    catch (loadError) { setError(loadError.message || "Could not load notifications."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function saveSettings() {
    setSaving(true); setError(""); setNotice("");
    try {
      const headers = await csrfHeaders();
      const result = await requestJson("system_notifications.php", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ action: "settings", settings }) });
      setNotice(result.message || "Settings saved.");
    } catch (saveError) { setError(saveError.message || "Could not save trigger settings."); }
    finally { setSaving(false); }
  }

  async function sent(message) { setCompose(false); setNotice(message); await refresh(); }
  const messages = (data?.notifications || []).filter((item) => !search.trim() || `${item.title} ${item.message} ${item.category}`.toLowerCase().includes(search.trim().toLowerCase()));

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">System</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Notifications</h1><p className="mt-2 text-[13px] text-[#a09b93]">Manage customer broadcasts and review admin-only system events.</p></div><button onClick={() => setCompose(true)} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#c9a954] px-4 text-xs font-semibold text-[#17140e]"><Plus size={14} /> Compose</button></div>{error && <div role="alert" className="mb-4 rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]">{error}</div>}{notice && <div role="status" className="mb-4 rounded-md border border-[#42734a]/30 bg-[#42734a]/10 px-4 py-3 text-sm text-[#83bd8b]">{notice}</div>}<div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]"><section className="rounded-xl border border-white/[.06] bg-[#131315] p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-base text-[#e8e4dc]">Admin notification history</h2><input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Filter notifications…" className="h-8 max-w-48 rounded border border-white/[.07] bg-[#0e0e10] px-2.5 text-xs text-[#eae6df] outline-none placeholder:text-[#69655f]" /></div><div className="divide-y divide-white/[.06]">{messages.map((item, index) => <article key={`${item.created_at}-${item.title}-${index}`} className="py-3.5 first:pt-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] ${chipColors[item.category] || "bg-white/[.08] text-[#c8c3ba]"}`}>{item.category}</span><h3 className="text-xs font-semibold text-[#ddd8cf]">{item.title}</h3></div><p className="mt-1.5 text-[11px] text-[#88837b]">{item.message}</p><p className="mt-1 text-[10px] text-[#66635f]">Sent to {Number(item.recipient_count || 0).toLocaleString("en-PH")} customers · {dateTime(item.created_at)}</p></article>)}{loading && !data && <p className="py-8 text-center text-sm text-[#88837b]">Loading notifications…</p>}{!loading && messages.length === 0 && <p className="py-8 text-center text-sm text-[#88837b]">No notifications found.</p>}</div></section><section className="rounded-xl border border-white/[.06] bg-[#131315] p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-base text-[#e8e4dc]">Automated triggers</h2><button disabled={saving} onClick={saveSettings} className="text-xs font-medium text-[#d2b765] disabled:opacity-50">{saving ? "Saving…" : "Save"}</button></div><div className="space-y-4">{triggers.map(([key, label, description]) => <label key={key} className={`flex items-start justify-between gap-4 ${key === "abandoned_cart" ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}><span><span className="block text-xs font-semibold text-[#ded9d0]">{label}</span><span className="mt-0.5 block text-[10px] text-[#77736d]">{description}</span></span><input type="checkbox" checked={Boolean(settings[key])} disabled={key === "abandoned_cart"} onChange={(e) => setSettings({ ...settings, [key]: e.target.checked ? 1 : 0 })} className="mt-0.5 accent-[#c9a954]" /></label>)}</div></section></div>{compose && <ComposeDialog onClose={() => setCompose(false)} onSent={sent} />}</main>;
}
