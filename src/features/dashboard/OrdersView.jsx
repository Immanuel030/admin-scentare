import { useEffect, useMemo, useState } from "react";
import { Download, MapPin, Phone, X } from "lucide-react";
import { assignRider, getOrderDetails, getOrders, updateOrderStatus } from "./ordersApi.js";

const filters = [["all", "All"], ["pending", "Pending"], ["processing", "Processing"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]];
const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

function readable(value = "") {
  return String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(`${String(value).replace(" ", "T")}${String(value).includes("Z") ? "" : "Z"}`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", withTime
    ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function displayStatus(order) {
  if (order.payment_status === "failed") return "Payment failed";
  if (order.status === "out_for_delivery") return "Out for delivery";
  if (order.status === "failed_delivery") return "Failed delivery";
  if (order.status === "returned_to_sender") return "Returned";
  return readable(order.status);
}

function statusColor(order) {
  if (order.payment_status === "failed" || ["cancelled", "failed_delivery", "returned_to_sender"].includes(order.status)) return "bg-[#873d35]/20 text-[#db8578]";
  if (["delivered"].includes(order.status)) return "bg-[#42734a]/20 text-[#83bd8b]";
  if (["pending"].includes(order.status)) return "bg-white/[.07] text-[#aaa69f]";
  return "bg-[#81672c]/20 text-[#d4b358]";
}

function OrderDetails({ order, transitions, riders, onClose, onUpdate, onAssignRider }) {
  const [nextStatus, setNextStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [riderChoice, setRiderChoice] = useState(order.rider_id ? String(order.rider_id) : "");
  const [riderBusy, setRiderBusy] = useState(false);
  const [riderError, setRiderError] = useState("");
  const fullAddress = [order.line1, order.barangay, order.city, order.province, order.postal_code].filter(Boolean).join(", ");
  const isDelivery = order.fulfillment_method === "delivery";

  async function updateStatus() {
    if (!nextStatus) return;
    setBusy(true);
    setError("");
    try {
      await onUpdate(order.id, nextStatus);
      setNextStatus("");
    } catch (updateError) {
      setError(updateError.message || "Could not update this order.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRider() {
    setRiderBusy(true);
    setRiderError("");
    try {
      await onAssignRider(order.id, riderChoice ? Number(riderChoice) : null);
    } catch (assignError) {
      setRiderError(assignError.message || "Could not assign a rider.");
    } finally {
      setRiderBusy(false);
    }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="order-dialog-title" className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-white/10 bg-[#151517] p-5 shadow-2xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#c9a954]">Order details</p><div className="mt-1 flex flex-wrap items-center gap-3"><h2 id="order-dialog-title" className="font-serif text-2xl text-[#f0ece5]">{order.order_number}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusColor(order)}`}>{displayStatus(order)}</span></div><p className="mt-1 text-sm text-[#8f8a82]">Placed {formatDate(order.created_at, true)}</p></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-md text-[#aaa69f] hover:bg-white/5" aria-label="Close order details"><X size={18} /></button></div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-white/[.06] bg-[#101012] p-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#928d84]">Customer &amp; delivery</h3><p className="text-sm font-medium text-[#e6e1d8]">{order.full_name}</p><p className="mt-1 text-xs text-[#aaa69f]">{order.customer_email || "No email"}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-[#aaa69f]"><Phone size={12} />{order.phone || "No phone"}</p><p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-[#aaa69f]"><MapPin size={12} className="mt-0.5 shrink-0" />{fullAddress || "Store pickup"}</p><p className="mt-3 text-xs text-[#d2bd7a]">{isDelivery ? "Local delivery" : "Store pickup"}</p>{order.delivery_instructions && <p className="mt-2 text-xs text-[#88837b]">Instructions: {order.delivery_instructions}</p>}
          {isDelivery && <div className="mt-3 border-t border-white/[.06] pt-3"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#928d84]">Rider</p>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Assign rider" value={riderChoice} onChange={(event) => setRiderChoice(event.target.value)} className="h-9 min-w-36 rounded-md border border-white/[.08] bg-[#0d0d0f] px-2.5 text-xs text-[#d3cec4] outline-none">
                <option value="">Unassigned</option>
                {(riders || []).map((rider) => <option key={rider.id} value={rider.id}>{rider.name}</option>)}
              </select>
              <button type="button" disabled={riderBusy || String(order.rider_id || "") === riderChoice} onClick={saveRider} className="h-9 rounded-md bg-[#c9a954] px-3 text-xs font-semibold text-[#17140e] disabled:opacity-50">{riderBusy ? "Saving…" : "Save"}</button>
            </div>
            {order.rider_phone && <p className="mt-1.5 text-[11px] text-[#88837b]">{order.rider_phone}</p>}
            {riderError && <p role="alert" className="mt-1.5 text-[11px] text-[#e18b7e]">{riderError}</p>}
          </div>}
        </section>
        <section className="rounded-lg border border-white/[.06] bg-[#101012] p-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#928d84]">Payment</h3><p className="flex justify-between text-xs text-[#aaa69f]"><span>Payment method</span><span className="text-[#d7d2c9]">{readable(order.payment_method)}</span></p><p className="mt-2 flex justify-between text-xs text-[#aaa69f]"><span>Payment status</span><span className="text-[#d7d2c9]">{readable(order.payment_status)}</span></p><p className="mt-2 flex justify-between text-xs text-[#aaa69f]"><span>Subtotal</span><span className="text-[#d7d2c9]">{currency.format(Number(order.subtotal) || 0)}</span></p><p className="mt-2 flex justify-between text-xs text-[#aaa69f]"><span>Delivery fee</span><span className="text-[#d7d2c9]">{currency.format(Number(order.shipping_fee) || 0)}</span></p><p className="mt-3 flex justify-between border-t border-white/[.06] pt-3 text-sm font-semibold text-[#eeeae3]"><span>Total</span><span>{currency.format(Number(order.total) || 0)}</span></p>{order.notes && <p className="mt-3 text-xs text-[#88837b]">Order note: {order.notes}</p>}</section>
      </div>
      <section className="mt-4 rounded-lg border border-white/[.06] bg-[#101012] p-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#928d84]">Items</h3><div className="divide-y divide-white/[.05]">{(order.items || []).map((item) => <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded border border-white/10 bg-[#0d0d0f]">{item.product_image ? <img src={item.product_image} alt="" className="size-full object-cover" /> : <span className="text-[10px] text-[#77736d]">S</span>}</span><span className="min-w-0 flex-1 truncate text-sm text-[#d7d2c9]">{item.product_name} <span className="text-xs text-[#88837b">× {item.quantity}</span></span><span className="text-xs text-[#d7d2c9]">{currency.format(Number(item.subtotal) || 0)}</span></div>)}{!order.items?.length && <p className="text-xs text-[#88837b]">No item details available.</p>}</div></section>
      <section className="mt-4 rounded-lg border border-white/[.06] bg-[#101012] p-4"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#928d84]">Status history</h3><div className="space-y-3">{(order.history || []).map((entry, index) => <div key={`${entry.status}-${entry.created_at}-${index}`} className="flex gap-3"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#c9a954]" /><div className="min-w-0 flex-1"><p className="text-xs font-medium text-[#d7d2c9]">{readable(entry.status)}</p>{entry.note && <p className="mt-0.5 text-xs text-[#88837b]">{entry.note}</p>}</div><span className="whitespace-nowrap text-[10px] text-[#77736d]">{formatDate(entry.created_at, true)}</span></div>)}{!order.history?.length && <p className="text-xs text-[#88837b]">No status history available.</p>}</div></section>
      <div className="mt-5 flex flex-col gap-3 border-t border-white/[.06] pt-4 sm:flex-row sm:items-center sm:justify-between">{transitions.length ? <div className="flex flex-wrap items-center gap-2"><select aria-label="Next order status" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="h-10 min-w-44 rounded-md border border-white/[.08] bg-[#101012] px-3 text-xs text-[#d3cec4] outline-none"><option value="">Choose next status</option>{transitions.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select><button disabled={!nextStatus || busy} onClick={updateStatus} className="h-10 rounded-md bg-[#c9a954] px-4 text-xs font-semibold text-[#17140e] disabled:opacity-50">{busy ? "Updating…" : "Update status"}</button></div> : <p className="text-xs text-[#88837b]">This order is in a final status.</p>}{error && <p role="alert" className="text-xs text-[#e18b7e]">{error}</p>}<button type="button" onClick={onClose} className="h-10 rounded-md border border-white/10 px-4 text-sm text-[#c8c3ba]">Close</button></div>
    </section>
  </div>;
}

function escapeCsv(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export default function OrdersView({ search, onSearchChange, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      getOrders({ page, status, search }).then((result) => {
        if (active) { setData(result); setPage(Number(result.page || 1)); setError(""); }
      }).catch((loadError) => { if (active) setError(loadError.message || "Could not load orders."); })
        .finally(() => { if (active) setLoading(false); });
    }, 150);
    return () => { active = false; clearTimeout(timer); };
  }, [page, status, search]);

  const orders = data?.orders || [];
  const counts = data?.counts || Object.fromEntries(filters.map(([key]) => [key, 0]));
  const shownPage = Number(data?.page || page);
  const pages = useMemo(() => {
    const count = Number(data?.pageCount || 1);
    const first = Math.max(1, Math.min(shownPage - 2, count - 4));
    return Array.from({ length: Math.min(5, count) }, (_, index) => first + index);
  }, [data?.pageCount, shownPage]);
  const start = Number(data?.total || 0) ? (shownPage - 1) * Number(data?.perPage || 10) + 1 : 0;
  const end = Math.min(shownPage * Number(data?.perPage || 10), Number(data?.total || 0));

  async function refresh() {
    setLoading(true);
    setError("");
    try { setData(await getOrders({ page, status, search })); }
    catch (loadError) { setError(loadError.message || "Could not load orders."); }
    finally { setLoading(false); }
  }

  async function openOrder(order) {
    setDetailLoading(true);
    setError("");
    try {
      const result = await getOrderDetails(order.id);
      setSelectedOrder(result);
    } catch (loadError) {
      setError(loadError.message || "Could not load order details.");
    } finally { setDetailLoading(false); }
  }

  async function handleStatusUpdate(id, nextStatus) {
    setBusy(true);
    try {
      await updateOrderStatus(id, nextStatus);
      const [details] = await Promise.all([getOrderDetails(id), refresh()]);
      setSelectedOrder(details);
      onUpdated?.();
    } finally { setBusy(false); }
  }

  async function handleAssignRider(id, riderId) {
    await assignRider(id, riderId);
    const [details] = await Promise.all([getOrderDetails(id), refresh()]);
    setSelectedOrder(details);
    onUpdated?.();
  }

  async function exportOrders() {
    setError("");
    try {
      const result = await getOrders({ page: 1, status, search, exportAll: true });
      const rows = [
        ["Order", "Customer", "Email", "Date", "Delivery", "Items", "Total", "Status", "Payment"],
        ...result.orders.map((order) => [order.order_number, order.customer, order.customer_email, order.created_at, order.delivery, order.items, order.total, displayStatus(order), readable(order.payment_status)]),
      ];
      const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "scentare-orders.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError.message || "Could not export orders.");
    }
  }

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">Sales</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Orders</h1><p className="mt-2 text-[13px] text-[#a09b93]">View, confirm, process, and track every customer order.</p></div><button onClick={exportOrders} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/[.08] px-4 text-xs font-medium text-[#d3cec4] hover:bg-white/[.04]"><Download size={14} /> Export orders</button></div>
    {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]"><span>{error}</span><button onClick={refresh} className="ml-4 underline">Retry</button></div>}
    <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]">
      <div className="flex flex-col gap-3 border-b border-white/[.06] p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] lg:max-w-[360px]"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => { setPage(1); onSearchChange(event.target.value); }} placeholder="Search order number or customer…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" /></label><div className="flex flex-wrap items-center gap-1 rounded-md border border-white/[.06] bg-[#101012] p-1">{filters.map(([value, label]) => <button key={value} onClick={() => { setPage(1); setStatus(value); }} className={`rounded px-2.5 py-1.5 text-xs ${status === value ? "bg-[#c9a954]/15 text-[#d8bc70]" : "text-[#8d8982] hover:text-[#eae6df]"}`}>{label}{value === "all" && <span className="ml-1 text-[10px] opacity-70">{Number(counts.all || 0).toLocaleString("en-PH")}</span>}</button>)}</div></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[860px] border-collapse text-left"><thead><tr className="border-b border-white/[.06] text-[11px] uppercase tracking-wide text-[#77736d]"><th className="px-5 py-3 font-medium">Order</th><th className="py-3 pr-4 font-medium">Customer</th><th className="py-3 pr-4 font-medium">Date</th><th className="py-3 pr-4 font-medium">Delivery</th><th className="py-3 pr-4 font-medium">Total</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-5 font-medium">Action</th></tr></thead><tbody className="divide-y divide-white/[.045]">{orders.map((order) => <tr key={order.id} className="hover:bg-white/[.018]"><td className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold text-[#e4dfd6]">#{order.order_number}</td><td className="py-3.5 pr-4"><span className="block text-xs font-medium text-[#d7d2c9]">{order.customer}</span><span className="mt-0.5 block text-[10px] text-[#77736d]">{order.customer_email}</span></td><td className="whitespace-nowrap py-3.5 pr-4 text-xs text-[#aaa69f]">{formatDate(order.created_at)}</td><td className="py-3.5 pr-4 text-xs text-[#aaa69f]">{order.delivery}</td><td className="whitespace-nowrap py-3.5 pr-4 text-xs font-semibold text-[#ddd8cf]">{currency.format(Number(order.total) || 0)}</td><td className="py-3.5 pr-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${statusColor(order)}`}>● &nbsp;{displayStatus(order)}</span></td><td className="py-3.5 pr-5"><button onClick={() => openOrder(order)} className="text-xs font-medium text-[#d2b765] hover:text-[#f0d985]">View</button></td></tr>)}</tbody></table>{loading && !data && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading orders…</p>}{!loading && orders.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">{search ? "No orders match your search." : "No orders found for this status."}</p>}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] px-4 py-3.5 text-xs text-[#88837b] sm:px-5"><span>Showing {start}–{end} of {Number(data?.total || 0).toLocaleString("en-PH")} orders</span><nav aria-label="Order pages" className="flex items-center gap-1"><button disabled={shownPage <= 1} onClick={() => setPage(Math.max(1, shownPage - 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Previous</button>{pages.map((pageNumber) => <button key={pageNumber} aria-current={pageNumber === shownPage ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`size-8 rounded border text-xs ${pageNumber === shownPage ? "border-[#c9a954]/50 text-[#d7bb6b]" : "border-white/10 text-[#aaa69f] hover:bg-white/[.04]"}`}>{pageNumber}</button>)}<button disabled={shownPage >= Number(data?.pageCount || 1)} onClick={() => setPage(Math.min(Number(data?.pageCount || 1), shownPage + 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Next</button></nav></div>
    </section>
    {detailLoading && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70"><p className="rounded-lg border border-white/10 bg-[#151517] px-5 py-4 text-sm text-[#d7d2c9]">Loading order details…</p></div>}
    {selectedOrder && <OrderDetails key={`${selectedOrder.order.id}-${selectedOrder.order.updated_at}`} order={selectedOrder.order} transitions={selectedOrder.transitions || []} riders={selectedOrder.riders || []} onClose={() => setSelectedOrder(null)} onUpdate={handleStatusUpdate} onAssignRider={handleAssignRider} />}
    {busy && <div className="sr-only" role="status">Updating order status…</div>}
  </main>;
}
