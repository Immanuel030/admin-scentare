import { useEffect, useMemo, useState } from "react";
import { Check, Flag, Search, Star, Trash2 } from "lucide-react";
import { getReviews, moderateReview } from "./reviewsApi.js";

const filters = [["all", "All"], ["pending", "Pending"], ["published", "Published"], ["flagged", "Flagged"]];

function initials(name = "Customer") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).replace(" ", "T")}${String(value).includes("Z") ? "" : "Z"}`);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

const statusStyle = {
  pending: "bg-[#81672c]/20 text-[#d4b358]",
  published: "bg-[#42734a]/20 text-[#83bd8b]",
  flagged: "bg-[#873d35]/20 text-[#db8578]",
};

export default function ReviewsView({ search, onSearchChange, onUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      getReviews({ page, status, search }).then((result) => {
        if (active) { setData(result); setPage(Number(result.page || 1)); setError(""); }
      }).catch((loadError) => { if (active) setError(loadError.message || "Could not load reviews."); })
        .finally(() => { if (active) setLoading(false); });
    }, 150);
    return () => { active = false; clearTimeout(timer); };
  }, [page, status, search]);

  const reviews = data?.reviews || [];
  const counts = data?.counts || { all: 0, pending: 0, published: 0, flagged: 0 };
  const stats = data?.stats || { average_rating: 0, pending_count: 0, flagged_count: 0, published_this_month: 0 };
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
    try { setData(await getReviews({ page, status, search })); }
    catch (loadError) { setError(loadError.message || "Could not load reviews."); }
    finally { setLoading(false); }
  }

  async function moderate(review, action) {
    if (action === "remove" && !window.confirm("Remove this review from the published and moderation lists?")) return;
    setBusyId(review.id);
    setError("");
    try {
      await moderateReview(review.id, action);
      await refresh();
      onUpdated?.();
    } catch (moderationError) {
      setError(moderationError.message || "Could not update this review.");
    } finally { setBusyId(null); }
  }

  const statCards = [
    { label: "Average rating", value: Number(stats.average_rating || 0).toFixed(1), tone: "text-[#eeeae3]" },
    { label: "Pending approval", value: Number(stats.pending_count || 0).toLocaleString("en-PH"), tone: "text-[#d7b85c]" },
    { label: "Flagged as spam", value: Number(stats.flagged_count || 0).toLocaleString("en-PH"), tone: "text-[#d27668]" },
    { label: "Published this month", value: Number(stats.published_this_month || 0).toLocaleString("en-PH"), tone: "text-[#eeeae3]" },
  ];

  return <main className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-7 sm:pt-8 xl:px-9">
    <div className="mb-5"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[#c5a454]">People</p><h1 className="font-serif text-[30px] leading-tight text-[#f0ece5] sm:text-[34px]">Reviews</h1><p className="mt-2 text-[13px] text-[#a09b93]">Monitor, approve, or remove customer reviews and ratings.</p></div>
    {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#873d35]/30 bg-[#873d35]/10 px-4 py-3 text-sm text-[#e18b7e]"><span>{error}</span><button onClick={refresh} className="ml-4 underline">Retry</button></div>}
    <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">{statCards.map((card) => <article key={card.label} className="rounded-lg border border-white/[.06] bg-[#131315] p-4"><p className="text-xs text-[#8d8982]">{card.label}</p><p className={`mt-2 font-serif text-2xl ${card.tone}`}>{loading ? "…" : card.value}</p></article>)}</section>
    <section className="overflow-hidden rounded-xl border border-white/[.06] bg-[#131315]">
      <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:items-center"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[.07] bg-[#0e0e10] px-3 text-[#77736e] sm:max-w-[360px]"><Search size={15} /><input value={search} onChange={(event) => { setPage(1); onSearchChange(event.target.value); }} placeholder="Search reviews…" className="min-w-0 flex-1 bg-transparent text-sm text-[#eae6df] outline-none placeholder:text-[#69655f]" /></label><div className="flex flex-wrap items-center gap-1 rounded-md border border-white/[.06] bg-[#101012] p-1">{filters.map(([value, label]) => <button key={value} onClick={() => { setPage(1); setStatus(value); }} className={`rounded px-3 py-1.5 text-xs ${status === value ? "bg-[#c9a954]/15 text-[#d8bc70]" : "text-[#8d8982] hover:text-[#eae6df]"}`}>{label}<span className="ml-1.5 text-[10px] opacity-70">{Number(counts[value] || 0).toLocaleString("en-PH")}</span></button>)}</div></div>
      <div className="divide-y divide-white/[.05]">
        {reviews.map((review) => <article key={review.id} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8e5df] text-xs font-semibold text-[#514b42]">{initials(review.customer_name)}</span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-semibold text-[#e6e1d8]">{review.customer_name}</span><span className="inline-flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={11} className={star <= Number(review.rating) ? "fill-[#c9a954] text-[#c9a954]" : "text-[#5e5a53]"} />)}</span><span className="text-xs text-[#77736d]">on {review.product_name}</span></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#b7b2aa]">{review.comment || "(No written comment)"}</p><p className="mt-2 text-[10px] text-[#77736d]">{formatDate(review.created_at)}</p></div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end"><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusStyle[review.moderation_status]}`}>● &nbsp;{review.moderation_status === "flagged" ? "Flagged · spam" : review.moderation_status[0].toUpperCase() + review.moderation_status.slice(1)}</span>{review.moderation_status === "pending" && <button disabled={busyId === review.id} onClick={() => moderate(review, "approve")} className="inline-flex h-8 items-center gap-1 rounded border border-white/[.08] px-2.5 text-[11px] font-medium text-[#d8c47f] hover:bg-white/[.04] disabled:opacity-40"><Check size={12} /> Approve</button>}{review.moderation_status === "flagged" ? <button disabled={busyId === review.id} onClick={() => moderate(review, "publish")} className="inline-flex h-8 items-center gap-1 rounded border border-white/[.08] px-2.5 text-[11px] text-[#bfcdbf] hover:bg-white/[.04] disabled:opacity-40"><Check size={12} /> Publish</button> : review.moderation_status === "published" || review.moderation_status === "pending" ? <button disabled={busyId === review.id} onClick={() => moderate(review, "flag")} title="Flag as spam" aria-label={`Flag review by ${review.customer_name} as spam`} className="grid size-8 place-items-center rounded border border-white/[.08] text-[#aaa69f] hover:border-[#873d35]/30 hover:text-[#db8578] disabled:opacity-40"><Flag size={13} /></button> : null}<button disabled={busyId === review.id} onClick={() => moderate(review, "remove")} title="Remove review" aria-label={`Remove review by ${review.customer_name}`} className="grid size-8 place-items-center rounded border border-white/[.08] text-[#aaa69f] hover:border-[#873d35]/30 hover:text-[#db8578] disabled:opacity-40"><Trash2 size={13} /></button></div>
        </article>)}
        {loading && !data && <p className="px-5 py-12 text-center text-sm text-[#88837b]">Loading reviews…</p>}
        {!loading && reviews.length === 0 && <p className="px-5 py-12 text-center text-sm text-[#88837b]">{search ? "No reviews match your search." : status === "all" ? "No reviews yet." : `No ${status} reviews.`}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] px-4 py-3.5 text-xs text-[#88837b] sm:px-5"><span>Showing {start}–{end} of {Number(data?.total || 0).toLocaleString("en-PH")} reviews</span><nav aria-label="Review pages" className="flex items-center gap-1"><button disabled={shownPage <= 1} onClick={() => setPage(Math.max(1, shownPage - 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Previous</button>{pages.map((pageNumber) => <button key={pageNumber} aria-current={pageNumber === shownPage ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`size-8 rounded border text-xs ${pageNumber === shownPage ? "border-[#c9a954]/50 text-[#d7bb6b]" : "border-white/10 text-[#aaa69f] hover:bg-white/[.04]"}`}>{pageNumber}</button>)}<button disabled={shownPage >= Number(data?.pageCount || 1)} onClick={() => setPage(Math.min(Number(data?.pageCount || 1), shownPage + 1))} className="rounded border border-white/10 px-2.5 py-1.5 disabled:opacity-35">Next</button></nav></div>
    </section>
  </main>;
}
